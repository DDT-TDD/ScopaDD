import { rankOf, suitIndex, type CardId } from '../../cards/types';

export interface SolitaireState {
  /** 4 foundations: [denari, coppe, spade, bastoni], each holding cards from Asso (1) up to Re (10) */
  foundations: CardId[][];
  /** 4 tableau columns */
  tableau: CardId[][];
  /** Face-down stock pile */
  stock: CardId[];
  /** Face-up waste pile (top card is playable) */
  waste: CardId[];
  /** Move count */
  moves: number;
  /** Pass count through the stock */
  stockPasses: number;
  /** Whether the game is won (all 40 cards on foundations) */
  isWon: boolean;
}

/**
 * Checks if a card can be placed on a foundation pile.
 * Pile corresponds to suit (0: Denari, 1: Coppe, 2: Spade, 3: Bastoni).
 * Pile must be empty if card is Asso (rank 1), or top card must have rank = card.rank - 1.
 */
export function canMoveToFoundation(card: CardId, foundation: readonly CardId[]): boolean {
  const cRank = rankOf(card);
  const cSuit = suitIndex(card);

  if (foundation.length === 0) {
    return cRank === 1; // Must be Asso
  }

  const topCard = foundation[foundation.length - 1];
  const topRank = rankOf(topCard);
  const topSuit = suitIndex(topCard);

  return cSuit === topSuit && cRank === topRank + 1;
}

/**
 * Checks if a card can be placed on a tableau column.
 * Target column:
 * - If empty: any card can be placed!
 * - If not empty: card must have rank = topCard.rank - 1 AND different suit.
 */
export function canMoveToTableau(card: CardId, column: readonly CardId[]): boolean {
  if (column.length === 0) {
    return true; // Any card can fill an empty space
  }

  const topCard = column[column.length - 1];
  const cRank = rankOf(card);
  const cSuit = suitIndex(card);
  const topRank = rankOf(topCard);
  const topSuit = suitIndex(topCard);

  return cRank === topRank - 1 && cSuit !== topSuit;
}

/**
 * Validates if a sequence of cards within a tableau column is valid to move together.
 */
export function isValidTableauSequence(cards: readonly CardId[]): boolean {
  if (cards.length <= 1) return true;

  for (let i = 0; i < cards.length - 1; i++) {
    const cur = cards[i];
    const nxt = cards[i + 1];
    if (rankOf(nxt) !== rankOf(cur) - 1 || suitIndex(nxt) === suitIndex(cur)) {
      return false;
    }
  }

  return true;
}
