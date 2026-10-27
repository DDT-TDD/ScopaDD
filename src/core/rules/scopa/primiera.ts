import { rankOf, suitIndex, type CardId } from '../../cards/types';

/**
 * Authentic Italian Primiera scale:
 * 7: 21 pts, 6: 18 pts, Asso: 16 pts, 5: 15 pts, 4: 14 pts, 3: 13 pts, 2: 12 pts, Figures: 10 pts
 */
export const PRIMIERA_POINTS_FLAT: Record<number, number> = {
  7: 21,
  6: 18,
  1: 16,
  5: 15,
  4: 14,
  3: 13,
  2: 12,
  8: 10,  // Fante
  9: 10,  // Cavallo
  10: 10, // Re
};

export const PRIMIERA_POINTS_GRADED: Record<number, number> = {
  ...PRIMIERA_POINTS_FLAT,
  8: 8,   // Fante
  9: 9,   // Cavallo
  10: 10, // Re
};

export interface PrimieraResult {
  score: number;
  suitCount: number;
  bestCards: (CardId | null)[]; // 4 elements: [denari, coppe, spade, bastoni]
  pointsBySuit: number[];       // 4 elements
}

/**
 * Calculates the Primiera score for a set of captured cards.
 */
export function calculatePrimiera(
  cards: readonly CardId[],
  options: { gradedFigures?: boolean } = {}
): PrimieraResult {
  const pointsTable = options.gradedFigures ? PRIMIERA_POINTS_GRADED : PRIMIERA_POINTS_FLAT;
  
  const bestCards: (CardId | null)[] = [null, null, null, null];
  const pointsBySuit = [0, 0, 0, 0];

  for (const card of cards) {
    const s = suitIndex(card);
    const r = rankOf(card);
    const pts = pointsTable[r] ?? 0;

    if (pts > pointsBySuit[s]) {
      pointsBySuit[s] = pts;
      bestCards[s] = card;
    }
  }

  const suitCount = pointsBySuit.filter((pts) => pts > 0).length;
  const score = pointsBySuit.reduce((sum, pts) => sum + pts, 0);

  return {
    score,
    suitCount,
    bestCards,
    pointsBySuit,
  };
}

/**
 * Compares the Primiera results of multiple sides.
 * In authentic Italian rules, a 4-suit prime always beats any 3-suit prime.
 * Returns the winning side index (0, 1, ...), or -1 if tied or no valid prime.
 */
export function comparePrimiera(results: readonly PrimieraResult[]): number {
  if (results.length === 0) return -1;

  let bestSide = -1;
  let bestSuitCount = 0;
  let bestScore = -1;
  let isTie = false;

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    if (res.suitCount === 0) continue;

    if (res.suitCount > bestSuitCount) {
      bestSide = i;
      bestSuitCount = res.suitCount;
      bestScore = res.score;
      isTie = false;
    } else if (res.suitCount === bestSuitCount) {
      if (res.score > bestScore) {
        bestSide = i;
        bestScore = res.score;
        isTie = false;
      } else if (res.score === bestScore) {
        isTie = true;
      }
    }
  }

  return isTie ? -1 : bestSide;
}
