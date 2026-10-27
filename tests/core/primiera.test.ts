import { describe, it, expect } from 'vitest';
import { calculatePrimiera, comparePrimiera } from '../../src/core/rules/scopa/primiera';
import { makeCardId } from '../../src/core/cards/types';

describe('Primiera Scoring Evaluator', () => {
  it('correctly values authentic Italian primiera card rankings', () => {
    // 7 in all four suits = 21 * 4 = 84 points (maximum possible primiera)
    const fourSevens = [
      makeCardId(0, 7), // 7 Denari
      makeCardId(1, 7), // 7 Coppe
      makeCardId(2, 7), // 7 Spade
      makeCardId(3, 7), // 7 Bastoni
    ];
    const res = calculatePrimiera(fourSevens);
    expect(res.score).toBe(84);
    expect(res.suitCount).toBe(4);
    expect(res.pointsBySuit).toEqual([21, 21, 21, 21]);
  });

  it('selects the highest Primiera card in each suit', () => {
    // Coins: Ace (16), 6 (18), 7 (21) -> Should select 7 (21)
    // Cups: 6 (18) -> 18
    // Swords: Ace (16) -> 16
    // Clubs: 2 (12) -> 12
    const cards = [
      makeCardId(0, 1), // Ace Denari (16)
      makeCardId(0, 6), // 6 Denari (18)
      makeCardId(0, 7), // 7 Denari (21)
      makeCardId(1, 6), // 6 Coppe (18)
      makeCardId(2, 1), // Ace Spade (16)
      makeCardId(3, 2), // 2 Bastoni (12)
    ];
    const res = calculatePrimiera(cards);
    expect(res.score).toBe(21 + 18 + 16 + 12);
    expect(res.suitCount).toBe(4);
    expect(res.pointsBySuit).toEqual([21, 18, 16, 12]);
  });

  it('four-suit prime always beats a three-suit prime regardless of score', () => {
    // Side 0 has 4 suits, but lower cards: Aces in all 4 suits = 16 * 4 = 64
    const side0Cards = [
      makeCardId(0, 1), // 16
      makeCardId(1, 1), // 16
      makeCardId(2, 1), // 16
      makeCardId(3, 1), // 16
    ];
    // Side 1 has only 3 suits, but higher cards: Sevens in 3 suits = 21 * 3 = 63
    // Even if Side 1 had 7+7+7 = 63 and side 0 had 2+2+2+2 = 48, 4 suits still beats 3!
    const side1Cards = [
      makeCardId(0, 7), // 21
      makeCardId(1, 7), // 21
      makeCardId(2, 7), // 21
    ];

    const p0 = calculatePrimiera(side0Cards);
    const p1 = calculatePrimiera(side1Cards);

    expect(comparePrimiera([p0, p1])).toBe(0); // Side 0 wins because it has 4 suits
  });

  it('awards point to highest score when suit count is equal', () => {
    const side0 = calculatePrimiera([
      makeCardId(0, 7), // 21
      makeCardId(1, 7), // 21
      makeCardId(2, 6), // 18
      makeCardId(3, 6), // 18 -> total 78
    ]);
    const side1 = calculatePrimiera([
      makeCardId(0, 7), // 21
      makeCardId(1, 7), // 21
      makeCardId(2, 7), // 21
      makeCardId(3, 6), // 18 -> total 81
    ]);
    expect(comparePrimiera([side0, side1])).toBe(1); // Side 1 wins (81 vs 78)
  });

  it('detects ties and returns -1', () => {
    const side0 = calculatePrimiera([
      makeCardId(0, 7),
      makeCardId(1, 7),
      makeCardId(2, 6),
      makeCardId(3, 6),
    ]);
    const side1 = calculatePrimiera([
      makeCardId(0, 7),
      makeCardId(1, 7),
      makeCardId(2, 6),
      makeCardId(3, 6),
    ]);
    expect(comparePrimiera([side0, side1])).toBe(-1); // Tied
  });
});
