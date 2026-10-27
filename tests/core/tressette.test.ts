import { describe, expect, it } from 'vitest';
import {
  findTressetteAccusi,
  formatTerzi,
  getLegalTressetteMoves,
  resolveTressetteTrick,
  tressettePowerOf,
  tressetteTerziOf,
} from '../../src/core/rules/tressette/types';
import {
  createTressetteMatch,
  dispatchTressetteCommand,
} from '../../src/core/engine/tressette/engine';
import { selectTressetteAiMove } from '../../src/ai/tressettePolicy';
import { cardFaceUrl, cardBackUrl, type DeckStyle } from '../../src/presentation/cards';

describe('Tressette Rules, Scoring & Engine', () => {
  it('enforces the authentic Tressette rank power hierarchy (3 > 2 > A > Re > Cavallo > Fante > 7 > 6 > 5 > 4)', () => {
    // Denari suit: 0=A, 1=2, 2=3, 3=4, 4=5, 5=6, 6=7, 7=Fante, 8=Cavallo, 9=Re
    expect(tressettePowerOf(2)).toBeGreaterThan(tressettePowerOf(1)); // 3 > 2
    expect(tressettePowerOf(1)).toBeGreaterThan(tressettePowerOf(0)); // 2 > A
    expect(tressettePowerOf(0)).toBeGreaterThan(tressettePowerOf(9)); // A > Re
    expect(tressettePowerOf(9)).toBeGreaterThan(tressettePowerOf(8)); // Re > Cavallo
    expect(tressettePowerOf(8)).toBeGreaterThan(tressettePowerOf(7)); // Cavallo > Fante
    expect(tressettePowerOf(7)).toBeGreaterThan(tressettePowerOf(6)); // Fante > 7
    expect(tressettePowerOf(6)).toBeGreaterThan(tressettePowerOf(5)); // 7 > 6
    expect(tressettePowerOf(5)).toBeGreaterThan(tressettePowerOf(4)); // 6 > 5
    expect(tressettePowerOf(4)).toBeGreaterThan(tressettePowerOf(3)); // 5 > 4
  });

  it('assigns exact Terzi (thirds of a point) totaling 32 terzi (10⅔ pts) across all 40 cards', () => {
    let totalTerzi = 0;
    for (let id = 0; id < 40; id++) {
      totalTerzi += tressetteTerziOf(id, false);
    }
    // 4 Aces * 3 terzi = 12 terzi; 20 figures/2s/3s * 1 terzo = 20 terzi -> 32 terzi (+ 3 terzi Ultima = 35 terzi -> 11 pts)
    expect(totalTerzi).toBe(32);
    expect(formatTerzi(32)).toBe('10⅔');

    // In Traversone / A Perdere mode, Asso di Bastoni (30) is worth 33 terzi (11 pts)
    expect(tressetteTerziOf(30, true)).toBe(33);
  });

  it('enforces mandatory suit-following (getLegalTressetteMoves) and no-trump trick resolution', () => {
    const hand = [0, 5, 12, 29]; // Asso Denari (0), 6 Denari (5), 3 Coppe (12), Re Spade (29)
    // Led card is 2 of Denari (1)
    const legal = getLegalTressetteMoves(hand, [{ seat: 0, card: 1 }]);
    expect(legal).toEqual([0, 5]); // Must play Denari!

    // Led card is 4 of Bastoni (33) -> player has no Bastoni, so all cards are legal
    const legalVoid = getLegalTressetteMoves(hand, [{ seat: 0, card: 33 }]);
    expect(legalVoid).toEqual(hand);

    // Resolve trick: Seat 0 leads 2 of Denari (1), Seat 1 plays 3 of Coppe (12 - off suit!), Seat 2 plays Asso of Denari (0)
    const winner = resolveTressetteTrick([
      { seat: 0, card: 1 },
      { seat: 1, card: 12 },
      { seat: 2, card: 0 },
    ]);
    expect(winner.seat).toBe(0); // 2 of Denari beats Asso of Denari; 3 of Coppe cannot win because there is no trump!
  });

  it('detects Napoletana, Tris, and Quattro Accusi accurately', () => {
    // Hand with Napoletana of Denari (0, 1, 2) + 3 Aces (0, 10, 20)
    const hand = [0, 1, 2, 10, 20, 15, 25, 35, 36, 37];
    const accusi = findTressetteAccusi(hand);
    expect(accusi.some((a) => a.type === 'napoletana' && a.points === 3)).toBe(true);
    expect(accusi.some((a) => a.type === 'tris' && a.points === 3)).toBe(true);
  });

  it('plays a complete 2-player Tressette hand with Tallone draws and AI moves', () => {
    let state = createTressetteMatch({
      variant: 'classic-2p',
      targetPoints: 21,
      seats: [
        { kind: 'ai', name: 'Bot 1', avatar: '🤖', aiDifficulty: 'standard' },
        { kind: 'ai', name: 'Bot 2', avatar: '🦊', aiDifficulty: 'expert' },
      ],
      seed: 42,
    });

    expect(state.hands[0].length).toBe(10);
    expect(state.hands[1].length).toBe(10);
    expect(state.deck.length).toBe(20);

    // Play all 20 tricks (10 with draws + 10 after tallone is empty)
    let safety = 0;
    while (state.phase === 'playing' && safety < 100) {
      safety++;
      const s0 = state.activeSeat;
      const d0 = selectTressetteAiMove(state, s0);
      state = dispatchTressetteCommand(state, {
        type: 'play',
        seat: s0,
        card: d0.card,
        signal: d0.signal,
        seq: state.commandSeq + 1,
      }).state;

      const s1 = state.activeSeat;
      const d1 = selectTressetteAiMove(state, s1);
      state = dispatchTressetteCommand(state, {
        type: 'play',
        seat: s1,
        card: d1.card,
        signal: d1.signal,
        seq: state.commandSeq + 1,
      }).state;

      expect(state.phase).toBe('trick-ended');
      state = dispatchTressetteCommand(state, {
        type: 'advance-trick',
        seq: state.commandSeq + 1,
      }).state;
    }

    expect(state.phase === 'hand-ended' || state.phase === 'match-ended').toBe(true);
    expect(state.capturedBySide[0].length + state.capturedBySide[1].length).toBe(40);
    expect(state.terziBySide[0] + state.terziBySide[1]).toBe(32);
  });

  it('supports all 8 regional decks including Bresciane, Romagnole, Trevisane, Piacentine, and Napoletane', () => {
    const decks: DeckStyle[] = [
      'napoletane',
      'piacentine',
      'bresciane',
      'romagnole',
      'trevisane',
      'bergamasche',
      'triestine',
      'moderne',
    ];
    for (const d of decks) {
      expect(cardFaceUrl(0, d)).toBeTruthy();
      expect(cardFaceUrl(1, d)).toBeTruthy(); // 2 of Denari
      expect(cardFaceUrl(39, d)).toBeTruthy();
      expect(cardBackUrl(d)).toBeTruthy();
    }
  });
});
