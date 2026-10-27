import { FULL_DECK, suitIndex, type CardId } from '../../cards/types';
import { PRNG } from '../../rng/prng';
import {
  canMoveToFoundation,
  canMoveToTableau,
  isValidTableauSequence,
  type SolitaireState,
} from '../../rules/solitario/types';

/**
 * Initializes a new traditional Italian 40-Card Solitaire game.
 */
export function createSolitaireGame(seed: number = Date.now()): SolitaireState {
  const prng = new PRNG(seed);
  const deck = prng.shuffle([...FULL_DECK]);

  // Deal 1 card to each of the 4 tableau columns
  const tableau: CardId[][] = [[], [], [], []];
  for (let c = 0; c < 4; c++) {
    tableau[c].push(deck.pop()!);
  }

  return {
    foundations: [[], [], [], []], // [denari, coppe, spade, bastoni]
    tableau,
    stock: deck, // Remaining 36 cards
    waste: [],
    moves: 0,
    stockPasses: 0,
    isWon: false,
  };
}

/**
 * Checks if the game is won (all 4 foundations have 10 cards each).
 */
function checkWin(foundations: readonly (readonly CardId[])[]): boolean {
  return foundations.every((f) => f.length === 10);
}

/**
 * Draws the next card from the stock to the waste.
 * If the stock is empty, recycles the waste back into the stock.
 */
export function drawStock(state: SolitaireState): SolitaireState {
  const next: SolitaireState = {
    ...state,
    foundations: state.foundations.map((f) => [...f]),
    tableau: state.tableau.map((t) => [...t]),
    stock: [...state.stock],
    waste: [...state.waste],
    moves: state.moves + 1,
  };

  if (next.stock.length > 0) {
    const card = next.stock.pop()!;
    next.waste.push(card);
  } else if (next.waste.length > 0) {
    // Recycle waste into stock (reversed)
    next.stock = next.waste.reverse();
    next.waste = [];
    next.stockPasses += 1;
  }

  return next;
}

/**
 * Moves top waste card to its foundation.
 */
export function moveWasteToFoundation(state: SolitaireState): SolitaireState | null {
  if (state.waste.length === 0) return null;

  const card = state.waste[state.waste.length - 1];
  const suit = suitIndex(card);
  const foundation = state.foundations[suit];

  if (!canMoveToFoundation(card, foundation)) {
    return null;
  }

  const next: SolitaireState = {
    ...state,
    foundations: state.foundations.map((f) => [...f]),
    tableau: state.tableau.map((t) => [...t]),
    stock: [...state.stock],
    waste: [...state.waste],
    moves: state.moves + 1,
  };

  const moved = next.waste.pop()!;
  next.foundations[suit].push(moved);
  next.isWon = checkWin(next.foundations);

  return next;
}

/**
 * Moves top waste card to a tableau column.
 */
export function moveWasteToTableau(state: SolitaireState, colIndex: number): SolitaireState | null {
  if (state.waste.length === 0 || colIndex < 0 || colIndex >= 4) return null;

  const card = state.waste[state.waste.length - 1];
  const col = state.tableau[colIndex];

  if (!canMoveToTableau(card, col)) {
    return null;
  }

  const next: SolitaireState = {
    ...state,
    foundations: state.foundations.map((f) => [...f]),
    tableau: state.tableau.map((t) => [...t]),
    stock: [...state.stock],
    waste: [...state.waste],
    moves: state.moves + 1,
  };

  const moved = next.waste.pop()!;
  next.tableau[colIndex].push(moved);

  return next;
}

/**
 * Moves top card from a tableau column to its foundation.
 */
export function moveTableauToFoundation(state: SolitaireState, colIndex: number): SolitaireState | null {
  const col = state.tableau[colIndex];
  if (!col || col.length === 0) return null;

  const card = col[col.length - 1];
  const suit = suitIndex(card);
  const foundation = state.foundations[suit];

  if (!canMoveToFoundation(card, foundation)) {
    return null;
  }

  const next: SolitaireState = {
    ...state,
    foundations: state.foundations.map((f) => [...f]),
    tableau: state.tableau.map((t) => [...t]),
    stock: [...state.stock],
    waste: [...state.waste],
    moves: state.moves + 1,
  };

  const moved = next.tableau[colIndex].pop()!;
  next.foundations[suit].push(moved);
  next.isWon = checkWin(next.foundations);

  return next;
}

/**
 * Moves a sequence of cards from one tableau column to another.
 */
export function moveTableauToTableau(
  state: SolitaireState,
  fromCol: number,
  fromCardIdx: number,
  toCol: number
): SolitaireState | null {
  if (fromCol === toCol || fromCol < 0 || fromCol >= 4 || toCol < 0 || toCol >= 4) {
    return null;
  }

  const sourceCol = state.tableau[fromCol];
  const targetCol = state.tableau[toCol];

  if (!sourceCol || fromCardIdx < 0 || fromCardIdx >= sourceCol.length) {
    return null;
  }

  const movingCards = sourceCol.slice(fromCardIdx);
  if (!isValidTableauSequence(movingCards)) {
    return null;
  }

  const leadCard = movingCards[0];
  if (!canMoveToTableau(leadCard, targetCol)) {
    return null;
  }

  const next: SolitaireState = {
    ...state,
    foundations: state.foundations.map((f) => [...f]),
    tableau: state.tableau.map((t) => [...t]),
    stock: [...state.stock],
    waste: [...state.waste],
    moves: state.moves + 1,
  };

  const moved = next.tableau[fromCol].splice(fromCardIdx);
  next.tableau[toCol].push(...moved);

  return next;
}

/**
 * Auto-moves a card: tries foundation first, then legal tableau column.
 */
export function autoMove(state: SolitaireState, card: CardId): SolitaireState | null {
  // 1. Is card on top of waste?
  if (state.waste.length > 0 && state.waste[state.waste.length - 1] === card) {
    const toFnd = moveWasteToFoundation(state);
    if (toFnd) return toFnd;

    for (let c = 0; c < 4; c++) {
      const toTab = moveWasteToTableau(state, c);
      if (toTab) return toTab;
    }
  }

  // 2. Is card in tableau?
  for (let c = 0; c < 4; c++) {
    const col = state.tableau[c];
    const idx = col.indexOf(card);
    if (idx !== -1) {
      // If it's the top card of column, try foundation
      if (idx === col.length - 1) {
        const toFnd = moveTableauToFoundation(state, c);
        if (toFnd) return toFnd;
      }

      // Try other tableau columns
      for (let targetCol = 0; targetCol < 4; targetCol++) {
        if (targetCol !== c) {
          const toTab = moveTableauToTableau(state, c, idx, targetCol);
          if (toTab) return toTab;
        }
      }
    }
  }

  return null;
}
