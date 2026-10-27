import { rankOf, suitOf, type CardId, type Suit } from '../../cards/types';

/**
 * Briscola Card Point Values:
 * Asso: 11 pts, Tre: 10 pts, Re: 4 pts, Cavallo: 3 pts, Fante: 2 pts, Lisci (7, 6, 5, 4, 2): 0 pts
 */
export const BRISCOLA_POINTS: Record<number, number> = {
  1: 11, // Asso
  3: 10, // Tre
  10: 4, // Re
  9: 3,  // Cavallo
  8: 2,  // Fante
  7: 0,
  6: 0,
  5: 0,
  4: 0,
  2: 0,
};

/**
 * Trick taking power ranking (higher number beats lower number):
 * Asso (10) > Tre (9) > Re (8) > Cavallo (7) > Fante (6) > 7 (5) > 6 (4) > 5 (3) > 4 (2) > 2 (1)
 */
export const BRISCOLA_POWER: Record<number, number> = {
  1: 10, // Asso (Highest)
  3: 9,  // Tre
  10: 8, // Re
  9: 7,  // Cavallo
  8: 6,  // Fante
  7: 5,
  6: 4,
  5: 3,
  4: 2,
  2: 1,  // Due (Lowest)
};

export function briscolaPointsOf(id: CardId): number {
  return BRISCOLA_POINTS[rankOf(id)] ?? 0;
}

export function briscolaPowerOf(id: CardId): number {
  return BRISCOLA_POWER[rankOf(id)] ?? 0;
}

export interface BriscolaTrickCard {
  seat: number;
  card: CardId;
}

/**
 * Resolves a Briscola trick according to authentic rules:
 * - Led suit is the suit of the first card played.
 * - If one or more trumps were played, the highest trump card wins.
 * - Otherwise, the highest card of the led suit wins.
 * - Other suits cannot win.
 * Returns the winning BriscolaTrickCard.
 */
export function resolveBriscolaTrick(
  trick: readonly BriscolaTrickCard[],
  trumpSuit: Suit
): BriscolaTrickCard {
  if (trick.length === 0) throw new Error('Cannot resolve empty trick');

  const ledSuit = suitOf(trick[0].card);

  let bestPlay = trick[0];
  let bestIsTrump = suitOf(trick[0].card) === trumpSuit;
  let bestPower = briscolaPowerOf(trick[0].card);

  for (let i = 1; i < trick.length; i++) {
    const play = trick[i];
    const s = suitOf(play.card);
    const power = briscolaPowerOf(play.card);
    const isTrump = s === trumpSuit;

    if (isTrump) {
      if (!bestIsTrump || power > bestPower) {
        bestPlay = play;
        bestIsTrump = true;
        bestPower = power;
      }
    } else if (!bestIsTrump && s === ledSuit) {
      if (power > bestPower) {
        bestPlay = play;
        bestPower = power;
      }
    }
  }

  return bestPlay;
}
