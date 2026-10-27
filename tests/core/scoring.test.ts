import { describe, it, expect } from 'vitest';
import { calculateNapola, evaluateScopaHand } from '../../src/core/rules/scopa/scoring';
import { PRESET_CONFIGS } from '../../src/core/rules/scopa/config';
import { makeCardId } from '../../src/core/cards/types';

describe('Scopa Scoring & Rules Evaluator', () => {
  it('calculates Napola correctly for unbroken sequences starting from Ace', () => {
    // A, 2, 3 of Denari -> 3 points
    const run3 = [makeCardId(0, 1), makeCardId(0, 2), makeCardId(0, 3)];
    expect(calculateNapola(run3)).toEqual({ points: 3, length: 3 });

    // A, 2, 3, 4, 5 of Denari -> 5 points
    const run5 = [
      makeCardId(0, 1),
      makeCardId(0, 2),
      makeCardId(0, 3),
      makeCardId(0, 4),
      makeCardId(0, 5),
    ];
    expect(calculateNapola(run5)).toEqual({ points: 5, length: 5 });

    // Broken run: A, 2, 4 (missing 3) -> 0 points
    const broken = [makeCardId(0, 1), makeCardId(0, 2), makeCardId(0, 4)];
    expect(calculateNapola(broken)).toEqual({ points: 0, length: 2 });

    // Run without Ace: 2, 3, 4 -> 0 points
    const noAce = [makeCardId(0, 2), makeCardId(0, 3), makeCardId(0, 4)];
    expect(calculateNapola(noAce)).toEqual({ points: 0, length: 0 });
  });

  it('evaluates complete hand scoring categories in Classic Scopa', () => {
    const config = PRESET_CONFIGS.classic;

    // Side 0: 22 cards, 6 coins, has 7 of Denari (Settebello), 1 Scopa
    const side0Cards = [
      makeCardId(0, 7), // 7 Denari (Settebello)
      makeCardId(0, 1),
      makeCardId(0, 2),
      makeCardId(0, 3),
      makeCardId(0, 4),
      makeCardId(0, 5), // 6 coins total
      makeCardId(1, 7), // 7 Coppe
      makeCardId(2, 7), // 7 Spade
      makeCardId(3, 7), // 7 Bastoni (all four 7s -> top Primiera!)
      // 13 more random cards to reach 22 cards
      ...Array.from({ length: 13 }, (_, i) => makeCardId(1, (i % 6) + 1)),
    ];

    // Side 1: 18 cards, 4 coins
    const side1Cards = [
      makeCardId(0, 6),
      makeCardId(0, 8),
      makeCardId(0, 9),
      makeCardId(0, 10), // 4 coins total
      ...Array.from({ length: 14 }, (_, i) => makeCardId(2, (i % 6) + 1)),
    ];

    const result = evaluateScopaHand(
      [side0Cards, side1Cards],
      [1, 0], // Side 0 has 1 scopa, Side 1 has 0 scope
      config
    );

    // Side 0 should win:
    // Scope: 1
    // Carte: 1 (22 vs 18)
    // Denari: 1 (6 vs 4)
    // Settebello: 1
    // Primiera: 1 (four 7s)
    // Total for Side 0 = 5 points
    expect(result.points[0]).toBe(5);
    expect(result.points[1]).toBe(0);
    expect(result.breakdown[0].carte).toBe(1);
    expect(result.breakdown[0].denari).toBe(1);
    expect(result.breakdown[0].setteBello).toBe(1);
    expect(result.breakdown[0].primiera).toBe(1);
    expect(result.breakdown[0].scope).toBe(1);
  });

  it('awards zero points for tied categories (Carte tie 20-20, Denari tie 5-5)', () => {
    const config = PRESET_CONFIGS.classic;

    // Both sides get 20 cards and 5 coins each
    const side0Cards = [
      makeCardId(0, 1), makeCardId(0, 2), makeCardId(0, 3), makeCardId(0, 4), makeCardId(0, 5),
      ...Array.from({ length: 15 }, (_, i) => makeCardId(1, (i % 6) + 1)),
    ];
    const side1Cards = [
      makeCardId(0, 6), makeCardId(0, 7), makeCardId(0, 8), makeCardId(0, 9), makeCardId(0, 10),
      ...Array.from({ length: 15 }, (_, i) => makeCardId(2, (i % 6) + 1)),
    ];

    const result = evaluateScopaHand([side0Cards, side1Cards], [0, 0], config);

    // Carte tied (20-20) -> 0 points
    expect(result.breakdown[0].carte).toBe(0);
    expect(result.breakdown[1].carte).toBe(0);

    // Denari tied (5-5) -> 0 points
    expect(result.breakdown[0].denari).toBe(0);
    expect(result.breakdown[1].denari).toBe(0);

    // Side 1 has 7 of Denari (makeCardId(0, 7)) -> 1 point for Sette Bello
    expect(result.breakdown[1].setteBello).toBe(1);
  });
});
