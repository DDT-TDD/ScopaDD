import { describe, it, expect } from 'vitest';
import { chooseAIMove } from '../../src/ai/policy';
import { PRESET_CONFIGS } from '../../src/core/rules/scopa/config';
import { makeCardId } from '../../src/core/cards/types';
import { PRNG } from '../../src/core/rng/prng';

describe('AI Opponents Policy', () => {
  const classic = PRESET_CONFIGS.classic;

  it('Standard AI takes an available Scopa sweep over a lesser capture', () => {
    // Hand has 7 of Coins and 3 of Swords
    // Table has only 7 of Swords (playing 7 of Coins sweeps table!)
    // Standard AI MUST pick 7 of Coins to score a Scopa!
    const sevenCoins = makeCardId(0, 7);
    const threeSwords = makeCardId(2, 3);
    const hand = [threeSwords, sevenCoins];
    const table = [makeCardId(2, 7)];

    const move = chooseAIMove(hand, table, classic, 'standard', new PRNG(1234));
    expect(move.card).toBe(sevenCoins);
  });

  it('Standard AI captures Settebello when available', () => {
    // Hand has 7 of Coins (Settebello) and 4 of Cups
    // Table has 7 of Cups and 4 of Swords
    const sevenCoins = makeCardId(0, 7);
    const fourCups = makeCardId(1, 4);
    const hand = [fourCups, sevenCoins];
    const table = [makeCardId(1, 7), makeCardId(2, 4)];

    const move = chooseAIMove(hand, table, classic, 'standard', new PRNG(1234));
    expect(move.card).toBe(sevenCoins);
  });

  it('Relaxed AI always makes a legal play', () => {
    const hand = [makeCardId(0, 2), makeCardId(1, 5), makeCardId(2, 8)];
    const table = [makeCardId(3, 5)];

    for (let i = 0; i < 20; i++) {
      const move = chooseAIMove(hand, table, classic, 'relaxed', new PRNG(i * 99));
      expect(hand).toContain(move.card);
    }
  });
});
