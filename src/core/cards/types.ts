/**
 * Card representation for traditional Italian 40-card decks.
 * CardId is an integer 0..39:
 * suit = Math.floor(id / 10): 0: Denari, 1: Coppe, 2: Spade, 3: Bastoni
 * rank = (id % 10) + 1: 1 (Asso) through 10 (Re)
 */

export type CardId = number;

export type Suit = 'denari' | 'coppe' | 'spade' | 'bastoni';

export const SUITS: readonly Suit[] = ['denari', 'coppe', 'spade', 'bastoni'] as const;

export const SUIT_NAMES_EN: Record<Suit, string> = {
  denari: 'Coins',
  coppe: 'Cups',
  spade: 'Swords',
  bastoni: 'Clubs',
};

export const SUIT_NAMES_IT: Record<Suit, string> = {
  denari: 'Denari',
  coppe: 'Coppe',
  spade: 'Spade',
  bastoni: 'Bastoni',
};

export const RANK_NAMES_EN: readonly string[] = [
  'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Jack', 'Knight', 'King'
];

export const RANK_NAMES_IT: readonly string[] = [
  'Asso', 'Due', 'Tre', 'Quattro', 'Cinque', 'Sei', 'Sette', 'Fante', 'Cavallo', 'Re'
];

export function suitOf(id: CardId): Suit {
  return SUITS[Math.floor(id / 10)] ?? 'denari';
}

export function suitIndex(id: CardId): number {
  return Math.floor(id / 10);
}

export function rankOf(id: CardId): number {
  return (id % 10) + 1;
}

export function valueOf(id: CardId): number {
  return rankOf(id);
}

export function makeCardId(suit: number, rank: number): CardId {
  return suit * 10 + (rank - 1);
}

export function cardName(id: CardId): string {
  if (id < 0 || id > 39 || !Number.isInteger(id)) return '';
  const r = rankOf(id);
  const s = suitOf(id);
  return `${RANK_NAMES_EN[r - 1]} of ${SUIT_NAMES_EN[s]}`;
}

export function cardNameIt(id: CardId): string {
  if (id < 0 || id > 39 || !Number.isInteger(id)) return '';
  const r = rankOf(id);
  const s = suitOf(id);
  return `${RANK_NAMES_IT[r - 1]} di ${SUIT_NAMES_IT[s]}`;
}

export function isCoin(id: CardId): boolean {
  return id >= 0 && id <= 9;
}

export function isSevenBello(id: CardId): boolean {
  return id === 6; // 7 of Denari
}

export function isKingOfCoins(id: CardId): boolean {
  return id === 9; // 10 of Denari (Re di Denari)
}

export function isMatta(id: CardId): boolean {
  return id === 16; // 7 of Coppe (Cirulla wild card)
}

/** Full 40-card Italian deck in order */
export const FULL_DECK: readonly CardId[] = Object.freeze(
  Array.from({ length: 40 }, (_, i) => i)
);
