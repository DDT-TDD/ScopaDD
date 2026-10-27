import { isCoin, isKingOfCoins, isSevenBello, rankOf, type CardId } from '../../cards/types';
import type { ScopaRulesConfig } from './config';
import { calculatePrimiera, comparePrimiera, type PrimieraResult } from './primiera';

export interface HandScoreResult {
  /** Points scored this hand per side [side0Points, side1Points, ...] */
  points: number[];
  /** Breakdown of categories per side */
  breakdown: {
    scope: number;
    carte: number;
    denari: number;
    setteBello: number;
    primiera: number;
    reBello: number;
    napola: number;
    declarations: number;
  }[];
  /** Primiera computation details per side */
  primieraDetails: PrimieraResult[];
  /** Total cards captured per side */
  cardCounts: number[];
  /** Total coins captured per side */
  coinCounts: number[];
  /** Napola run length per side */
  napolaLengths: number[];
}

/**
 * Calculates Napola bonus points for a set of captured cards.
 * Requires unbroken sequence of Denari starting from Ace (A=1, 2, 3...).
 * A-2-3 scores 3 pts; each subsequent card adds 1 pt (A-2-3-4 = 4 pts, up to 10).
 */
export function calculateNapola(capturedCards: readonly CardId[]): { points: number; length: number } {
  const coins = new Set(
    capturedCards.filter(isCoin).map((c) => rankOf(c))
  );

  let length = 0;
  for (let rank = 1; rank <= 10; rank++) {
    if (coins.has(rank)) {
      length++;
    } else {
      break;
    }
  }

  return { points: length >= 3 ? length : 0, length };
}

/**
 * Evaluates the full score for a completed Scopa hand across all sides.
 */
export function evaluateScopaHand(
  capturedCardsBySide: readonly (readonly CardId[])[],
  scopeCountBySide: readonly number[],
  config: ScopaRulesConfig,
  declarationPointsBySide?: readonly number[]
): HandScoreResult {
  const sideCount = capturedCardsBySide.length;
  const points = new Array(sideCount).fill(0);
  const breakdown = Array.from({ length: sideCount }, () => ({
    scope: 0,
    carte: 0,
    denari: 0,
    setteBello: 0,
    primiera: 0,
    reBello: 0,
    napola: 0,
    declarations: 0,
  }));

  const cardCounts = capturedCardsBySide.map((c) => c.length);
  const coinCounts = capturedCardsBySide.map(
    (cards) => cards.filter(isCoin).length
  );
  const napolaLengths = new Array(sideCount).fill(0);

  // 1. Scope points
  for (let i = 0; i < sideCount; i++) {
    const scopePts = scopeCountBySide[i] ?? 0;
    breakdown[i].scope = scopePts;
    points[i] += scopePts;
  }

  // 2. Declarations (Cirulla)
  if (declarationPointsBySide) {
    for (let i = 0; i < sideCount; i++) {
      const decPts = declarationPointsBySide[i] ?? 0;
      breakdown[i].declarations = decPts;
      points[i] += decPts;
    }
  }

  // 3. Carte (Most cards: strictly > 20 in 2-player/team game)
  let maxCards = -1;
  let carteWinner = -1;
  let carteTie = false;
  for (let i = 0; i < sideCount; i++) {
    if (cardCounts[i] > maxCards) {
      maxCards = cardCounts[i];
      carteWinner = i;
      carteTie = false;
    } else if (cardCounts[i] === maxCards) {
      carteTie = true;
    }
  }
  if (!carteTie && maxCards > 20 && carteWinner >= 0) {
    breakdown[carteWinner].carte = 1;
    points[carteWinner] += 1;
  }

  // 4. Denari (Most coins: strictly > 5 in 2-player/team game)
  let maxCoins = -1;
  let denariWinner = -1;
  let denariTie = false;
  for (let i = 0; i < sideCount; i++) {
    if (coinCounts[i] > maxCoins) {
      maxCoins = coinCounts[i];
      denariWinner = i;
      denariTie = false;
    } else if (coinCounts[i] === maxCoins) {
      denariTie = true;
    }
  }
  if (!denariTie && maxCoins > 5 && denariWinner >= 0) {
    breakdown[denariWinner].denari = 1;
    points[denariWinner] += 1;
  }

  // 5. Sette Bello (7 of Denari)
  for (let i = 0; i < sideCount; i++) {
    if (capturedCardsBySide[i].some(isSevenBello)) {
      breakdown[i].setteBello = 1;
      points[i] += 1;
      break;
    }
  }

  // 6. Re Bello (King of Denari, optional)
  if (config.reBello) {
    for (let i = 0; i < sideCount; i++) {
      if (capturedCardsBySide[i].some(isKingOfCoins)) {
        breakdown[i].reBello = 1;
        points[i] += 1;
        break;
      }
    }
  }

  // 7. Napola (Unbroken sequence from Ace of Denari, optional)
  if (config.napola) {
    for (let i = 0; i < sideCount; i++) {
      const nap = calculateNapola(capturedCardsBySide[i]);
      napolaLengths[i] = nap.length;
      if (nap.points > 0) {
        breakdown[i].napola = nap.points;
        points[i] += nap.points;
      }
    }
  }

  // 8. Primiera
  const primieraDetails = capturedCardsBySide.map((cards) =>
    calculatePrimiera(cards, { gradedFigures: config.gradedPrimiera })
  );
  const primieraWinner = comparePrimiera(primieraDetails);
  if (primieraWinner >= 0) {
    breakdown[primieraWinner].primiera = 1;
    points[primieraWinner] += 1;
  }

  return {
    points,
    breakdown,
    primieraDetails,
    cardCounts,
    coinCounts,
    napolaLengths,
  };
}
