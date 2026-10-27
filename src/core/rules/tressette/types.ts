import {
  rankOf,
  SUIT_NAMES_EN,
  SUIT_NAMES_IT,
  suitIndex,
  suitOf,
  type CardId,
  type Suit,
} from '../../cards/types';

/**
 * Tressette Trick-Taking Power Hierarchy (higher number beats lower number):
 * 3 (10) > 2 (9) > Asso/1 (8) > Re/10 (7) > Cavallo/9 (6) > Fante/8 (5) > 7 (4) > 6 (3) > 5 (2) > 4 (1)
 */
export const TRESSETTE_POWER: Record<number, number> = {
  3: 10, // Tre (Highest!)
  2: 9,  // Due
  1: 8,  // Asso
  10: 7, // Re
  9: 6,  // Cavallo
  8: 5,  // Fante
  7: 4,
  6: 3,
  5: 2,
  4: 1,  // Quattro (Lowest)
};

/**
 * Tressette Point Values in "Terzi" (thirds of a point, 3 terzi = 1 whole point):
 * - Asso (1): 3 terzi (1 point) — or 33 terzi (11 points) for Asso di Bastoni (id === 30) in "A Perdere / Traversone" mode
 * - 3, 2, Re (10), Cavallo (9), Fante (8): 1 terzo (⅓ point) each
 * - Lisci (7, 6, 5, 4): 0 terzi
 */
export const TRESSETTE_TERZI: Record<number, number> = {
  1: 3,  // Asso = 1 point (3/3)
  3: 1,  // Tre = 1/3 point
  2: 1,  // Due = 1/3 point
  10: 1, // Re = 1/3 point
  9: 1,  // Cavallo = 1/3 point
  8: 1,  // Fante = 1/3 point
  7: 0,
  6: 0,
  5: 0,
  4: 0,
};

export function tressettePowerOf(id: CardId): number {
  return TRESSETTE_POWER[rankOf(id)] ?? 0;
}

export function tressetteTerziOf(id: CardId, isPerdere: boolean = false): number {
  // In Tressette a Perdere (Traversone / Rovescino), the Asso di Bastoni (id 30) is worth 11 points (33 terzi)
  if (isPerdere && id === 30) {
    return 33;
  }
  return TRESSETTE_TERZI[rankOf(id)] ?? 0;
}

/**
 * Formats a count of terzi (thirds) as a human-readable score string, e.g. "4", "4⅓", "4⅔".
 */
export function formatTerzi(terzi: number): string {
  const whole = Math.floor(terzi / 3);
  const rem = ((terzi % 3) + 3) % 3;
  if (rem === 1) return `${whole}⅓`;
  if (rem === 2) return `${whole}⅔`;
  return `${whole}`;
}

export type TressetteSignal = 'busso' | 'striscio' | 'volo' | null;

export interface TressetteTrickCard {
  seat: number;
  card: CardId;
  signal?: TressetteSignal;
}

export interface TressetteAccuso {
  type: 'napoletana' | 'tris' | 'quattro';
  points: number;
  cards: CardId[];
  labelIt: string;
  labelEn: string;
}

/**
 * Returns the legal cards a player can play from their hand given the current trick.
 * - On lead (trick.length === 0): any card in hand is legal.
 * - Following (trick.length > 0): MUST play a card of the led suit if holding one; otherwise any card.
 */
export function getLegalTressetteMoves(
  hand: readonly CardId[],
  trick: readonly TressetteTrickCard[]
): CardId[] {
  if (trick.length === 0) return [...hand];
  const ledSuit: Suit = suitOf(trick[0].card);
  const ofSuit = hand.filter((c) => suitOf(c) === ledSuit);
  return ofSuit.length > 0 ? ofSuit : [...hand];
}

/**
 * Resolves a Tressette trick:
 * - There is NO trump suit in Tressette.
 * - Only cards matching the led suit (the suit of the first card played) can win the trick.
 * - Among cards of the led suit, the one with the highest `tressettePowerOf` wins.
 */
export function resolveTressetteTrick(
  trick: readonly TressetteTrickCard[]
): TressetteTrickCard {
  if (trick.length === 0) throw new Error('Cannot resolve empty Tressette trick');

  const ledSuit = suitOf(trick[0].card);
  let bestPlay = trick[0];
  let bestPower = tressettePowerOf(trick[0].card);

  for (let i = 1; i < trick.length; i++) {
    const play = trick[i];
    if (suitOf(play.card) === ledSuit) {
      const power = tressettePowerOf(play.card);
      if (power > bestPower) {
        bestPlay = play;
        bestPower = power;
      }
    }
  }

  return bestPlay;
}

/**
 * Detects traditional Tressette declarations (Accusi / Bongioco):
 * - Napoletana: Asso (1), Due (2), and Tre (3) of the same suit -> 3 points
 * - Tris (Bongioco): 3 Aces, 3 Twos, or 3 Threes -> 3 points
 * - Quattro (Stella / Super Bongioco): all 4 Aces, 4 Twos, or 4 Threes -> 4 points
 */
export function findTressetteAccusi(hand: readonly CardId[]): TressetteAccuso[] {
  const accusi: TressetteAccuso[] = [];
  const handSet = new Set(hand);

  // 1. Check Napoletana for each suit (0: Denari, 1: Coppe, 2: Spade, 3: Bastoni)
  for (let s = 0; s < 4; s++) {
    const base = s * 10;
    const c1 = base + 0; // Asso
    const c2 = base + 1; // Due
    const c3 = base + 2; // Tre
    if (handSet.has(c1) && handSet.has(c2) && handSet.has(c3)) {
      const suitKey = suitOf(c1);
      accusi.push({
        type: 'napoletana',
        points: 3,
        cards: [c1, c2, c3],
        labelIt: `Napoletana a ${SUIT_NAMES_IT[suitKey]} (+3 pt)`,
        labelEn: `Napoletana of ${SUIT_NAMES_EN[suitKey]} (+3 pts)`,
      });
    }
  }

  // 2. Check Tris (3 of a kind) or Quattro (4 of a kind) for ranks 1 (Asso), 2 (Due), 3 (Tre)
  const targetRanks: Array<{ rank: number; nameIt: string; nameEn: string }> = [
    { rank: 3, nameIt: 'Tre', nameEn: 'Threes' },
    { rank: 2, nameIt: 'Due', nameEn: 'Twos' },
    { rank: 1, nameIt: 'Assi', nameEn: 'Aces' },
  ];

  for (const t of targetRanks) {
    const matching = hand.filter((c) => rankOf(c) === t.rank);
    if (matching.length === 4) {
      accusi.push({
        type: 'quattro',
        points: 4,
        cards: matching,
        labelIt: `Quattro ${t.nameIt} (+4 pt)`,
        labelEn: `Four ${t.nameEn} (+4 pts)`,
      });
    } else if (matching.length === 3) {
      accusi.push({
        type: 'tris',
        points: 3,
        cards: matching,
        labelIt: `Tris di ${t.nameIt} (+3 pt)`,
        labelEn: `Three ${t.nameEn} (+3 pts)`,
      });
    }
  }

  return accusi;
}

/**
 * Sorts a hand of cards by suit (Denari, Coppe, Spade, Bastoni) and then by Tressette strength (3 > 2 > A > Re > Cav > Fan > 7 > 6 > 5 > 4).
 */
export function sortHandForTressette(hand: readonly CardId[]): CardId[] {
  return [...hand].sort((a, b) => {
    const suitDiff = suitIndex(a) - suitIndex(b);
    if (suitDiff !== 0) return suitDiff;
    return tressettePowerOf(b) - tressettePowerOf(a);
  });
}
