import { describe, it, expect } from 'vitest';
import {
  briscolaPointsOf,
  resolveBriscolaTrick,
} from '../../src/core/rules/briscola/types';
import {
  applyBriscolaCommand,
  createBriscolaMatch,
  type BriscolaMatchSetup,
} from '../../src/core/engine/briscola/engine';
import { chooseBriscolaAIMove } from '../../src/ai/briscolaPolicy';
import { FULL_DECK, makeCardId } from '../../src/core/cards/types';

describe('Briscola Rules, Variants & AI Engine', () => {
  it('verifies exact Italian card point values (total 120 pts in deck)', () => {
    let totalPoints = 0;
    for (const card of FULL_DECK) {
      totalPoints += briscolaPointsOf(card);
    }
    expect(totalPoints).toBe(120);

    expect(briscolaPointsOf(makeCardId(0, 1))).toBe(11);
    expect(briscolaPointsOf(makeCardId(0, 3))).toBe(10);
    expect(briscolaPointsOf(makeCardId(0, 10))).toBe(4);
    expect(briscolaPointsOf(makeCardId(0, 9))).toBe(3);
    expect(briscolaPointsOf(makeCardId(0, 8))).toBe(2);
    expect(briscolaPointsOf(makeCardId(0, 7))).toBe(0);
  });

  it('correctly resolves trick when trump card is played', () => {
    const trick = [
      { seat: 0, card: makeCardId(2, 1) }, // Asso di Spade
      { seat: 1, card: makeCardId(1, 2) }, // 2 di Coppe (Briscola)
    ];

    const winner = resolveBriscolaTrick(trick, 'coppe');
    expect(winner.seat).toBe(1);
  });

  it('correctly resolves trick when no trump is played (highest of led suit wins)', () => {
    const trick1 = [
      { seat: 0, card: makeCardId(2, 7) },
      { seat: 1, card: makeCardId(2, 3) },
    ];
    expect(resolveBriscolaTrick(trick1, 'coppe').seat).toBe(1);

    const trick2 = [
      { seat: 0, card: makeCardId(0, 10) },
      { seat: 1, card: makeCardId(3, 1) },
    ];
    expect(resolveBriscolaTrick(trick2, 'coppe').seat).toBe(0);
  });

  it('plays through a full 2-player match deterministically with AI policy', () => {
    const setup: BriscolaMatchSetup = {
      presetId: 'classic-2p',
      playerCount: 2,
      partnerships: false,
      openHands: false,
      targetPoints: 61,
      seats: [
        { kind: 'human', name: 'Mario', avatar: 'nonno' },
        { kind: 'ai', name: 'Luigi', avatar: 'wolf', aiDifficulty: 'expert' },
      ],
      seed: 98765,
    };

    let state = createBriscolaMatch(setup);
    expect(state.phase).toBe('playing');
    expect(state.hands[0].length).toBe(3);
    expect(state.hands[1].length).toBe(3);
    expect(state.deck.length).toBe(33);

    let seq = 1;
    while (state.phase !== 'match-ended') {
      if (state.phase === 'trick-ended') {
        state = applyBriscolaCommand(state, {
          type: 'advance-trick',
          seq: seq++,
        }).state;
      } else {
        const active = state.activeSeat;
        const card = chooseBriscolaAIMove(state, active, 'expert');
        state = applyBriscolaCommand(state, {
          type: 'play',
          seat: active,
          card,
          seq: seq++,
        }).state;
      }
    }

    expect(state.phase).toBe('match-ended');
    const totalCapturedPts = state.points[0] + state.points[1];
    expect(totalCapturedPts).toBe(120);
    expect(state.winnerSide).toBeDefined();
  });

  it('supports 4-player partnership Briscola in Coppia (2v2)', () => {
    const setup: BriscolaMatchSetup = {
      presetId: 'teams-4p',
      playerCount: 4,
      partnerships: true,
      openHands: false,
      targetPoints: 61,
      seats: [
        { kind: 'human', name: 'Tu', avatar: 'nonno' },
        { kind: 'ai', name: 'C1', avatar: 'wolf' },
        { kind: 'ai', name: 'Compagno', avatar: 'bear' },
        { kind: 'ai', name: 'C2', avatar: 'owl' },
      ],
      seed: 12345,
    };

    let state = createBriscolaMatch(setup);
    expect(state.hands.length).toBe(4);
    expect(state.deck.length).toBe(27); // 40 - 12 - 1 trump = 27

    let seq = 1;
    while (state.phase !== 'match-ended') {
      const active = state.activeSeat;
      const card = chooseBriscolaAIMove(state, active, 'standard');
      state = applyBriscolaCommand(
        state,
        { type: 'play', seat: active, card, seq: seq++ },
        true
      ).state;
    }

    expect(state.points[0] + state.points[1]).toBe(120);
  });
});
