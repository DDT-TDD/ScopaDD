import { describe, it, expect } from 'vitest';
import {
  applyScopaCommand,
  createScopaMatch,
  replayScopa,
  type ScopaCommand,
} from '../../src/core/engine/scopa/engine';
import { PRESET_CONFIGS } from '../../src/core/rules/scopa/config';
import type { ScopaMatchSetup } from '../../src/core/engine/scopa/state';
import { findLegalCaptures } from '../../src/core/rules/scopa/capture';

describe('Scopa Pure Functional Game Engine', () => {
  const setup: ScopaMatchSetup = {
    config: PRESET_CONFIGS.classic,
    seats: [
      { kind: 'human', name: 'Mario', avatar: 'nonno' },
      { kind: 'ai', name: 'Luigi', avatar: 'wolf', aiDifficulty: 'relaxed' },
    ],
    seed: 424242,
  };

  it('initializes Classic Scopa match with correct deck, hands, and table counts', () => {
    const state = createScopaMatch(setup);
    expect(state.phase).toBe('playing');
    expect(state.handIndex).toBe(0);
    expect(state.dealerSeat).toBe(1);
    expect(state.activeSeat).toBe(0); // Human Seat 0 plays first on Hand #1!

    // 2 players: 3 cards each = 6 cards
    // 4 cards on table
    // 30 cards in undealt deck
    // Total = 40 cards!
    expect(state.hands[0].length).toBe(3);
    expect(state.hands[1].length).toBe(3);
    expect(state.table.length).toBe(4);
    expect(state.deck.length).toBe(30);

    const allCards = [
      ...state.hands[0],
      ...state.hands[1],
      ...state.table,
      ...state.deck,
    ];
    expect(new Set(allCards).size).toBe(40);
  });

  it('rejects commands with invalid sequence numbers', () => {
    const state = createScopaMatch(setup);
    const card = state.hands[state.activeSeat][0];

    // Expected seq is 1, sending seq 2 should throw
    expect(() =>
      applyScopaCommand(state, {
        type: 'play',
        seat: state.activeSeat,
        card,
        seq: 2,
      })
    ).toThrow(/Invalid command sequence/);
  });

  it('rejects play from inactive seat', () => {
    const state = createScopaMatch(setup);
    const inactiveSeat = state.activeSeat === 0 ? 1 : 0;
    const card = state.hands[inactiveSeat][0];

    expect(() =>
      applyScopaCommand(state, {
        type: 'play',
        seat: inactiveSeat,
        card,
        seq: 1,
      })
    ).toThrow(/It is not seat/);
  });

  it('can play through a full hand deterministically and verify replay', () => {
    let state = createScopaMatch(setup);
    const commandLog: ScopaCommand[] = [];
    let seq = 1;

    // Play until hand ends
    while (state.phase === 'playing') {
      const activeSeat = state.activeSeat;
      const hand = state.hands[activeSeat];
      if (hand.length === 0) break;

      // Find first card with legal capture, or first card in hand
      let chosenCard = hand[0];
      let chosenOptionIndex = 0;

      for (const c of hand) {
        const caps = findLegalCaptures(c, state.table, state.setup.config);
        if (caps.length > 0) {
          chosenCard = c;
          chosenOptionIndex = 0;
          break;
        }
      }

      const cmd: ScopaCommand = {
        type: 'play',
        seat: activeSeat,
        card: chosenCard,
        captureOptionIndex: chosenOptionIndex,
        seq: seq++,
      };

      commandLog.push(cmd);
      const res = applyScopaCommand(state, cmd);
      state = res.state;
    }

    // Verify hand completed
    expect(state.phase === 'hand-ended' || state.phase === 'match-ended').toBe(true);
    expect(state.handScoreResult).not.toBeNull();
    expect(state.table.length).toBe(0); // All table cards assigned

    // Deterministic replay check
    const replayed = replayScopa(setup, commandLog);
    expect(replayed.cumulativeScores).toEqual(state.cumulativeScores);
    expect(replayed.capturedBySide[0].length).toBe(state.capturedBySide[0].length);
    expect(replayed.capturedBySide[1].length).toBe(state.capturedBySide[1].length);
  });
});
