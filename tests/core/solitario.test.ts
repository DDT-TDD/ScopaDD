import { describe, it, expect } from 'vitest';
import {
  createSolitaireGame,
  drawStock,
  moveTableauToTableau,
  moveWasteToFoundation,
  moveWasteToTableau,
} from '../../src/core/engine/solitario/engine';
import { makeCardId } from '../../src/core/cards/types';

describe('Italian 40-Card Solitaire Engine', () => {
  it('initializes with 4 tableau cards, 36 stock cards, and empty foundations', () => {
    const game = createSolitaireGame(12345);
    expect(game.tableau.length).toBe(4);
    expect(game.tableau.every((col) => col.length === 1)).toBe(true);
    expect(game.stock.length).toBe(36);
    expect(game.waste.length).toBe(0);
    expect(game.foundations.length).toBe(4);
    expect(game.foundations.every((f) => f.length === 0)).toBe(true);
    expect(game.isWon).toBe(false);
  });

  it('draws from stock into waste and flips waste when stock is empty', () => {
    let game = createSolitaireGame(12345);
    expect(game.stock.length).toBe(36);
    expect(game.waste.length).toBe(0);

    // Draw 1 card
    game = drawStock(game);
    expect(game.stock.length).toBe(35);
    expect(game.waste.length).toBe(1);

    // Empty the stock
    while (game.stock.length > 0) {
      game = drawStock(game);
    }
    expect(game.stock.length).toBe(0);
    expect(game.waste.length).toBe(36);

    // Drawing again recycles waste into stock
    game = drawStock(game);
    expect(game.stock.length).toBe(36);
    expect(game.waste.length).toBe(0);
    expect(game.stockPasses).toBe(1);
  });

  it('accepts Asso (rank 1) onto foundation and builds ascending', () => {
    const game = createSolitaireGame(12345);

    // Manually place Asso di Denari (id 0) on top of waste
    game.waste = [makeCardId(0, 1)]; // Asso di Denari
    const moved1 = moveWasteToFoundation(game);
    expect(moved1).not.toBeNull();
    expect(moved1!.foundations[0]).toEqual([makeCardId(0, 1)]);
    expect(moved1!.waste.length).toBe(0);

    // Place 2 di Denari (id 1)
    moved1!.waste = [makeCardId(0, 2)];
    const moved2 = moveWasteToFoundation(moved1!);
    expect(moved2).not.toBeNull();
    expect(moved2!.foundations[0]).toEqual([makeCardId(0, 1), makeCardId(0, 2)]);

    // Try placing 4 di Denari (wrong rank) -> should fail
    moved2!.waste = [makeCardId(0, 4)];
    const movedWrong = moveWasteToFoundation(moved2!);
    expect(movedWrong).toBeNull();
  });

  it('enforces descending rank and different suit in tableau columns', () => {
    const game = createSolitaireGame(12345);
    // Col 0 has 7 di Bastoni (suit 3, rank 7)
    game.tableau[0] = [makeCardId(3, 7)];

    // Place 6 di Coppe (suit 1, rank 6) from waste onto col 0 -> Valid!
    game.waste = [makeCardId(1, 6)];
    const moved = moveWasteToTableau(game, 0);
    expect(moved).not.toBeNull();
    expect(moved!.tableau[0].length).toBe(2);

    // Try placing 6 di Bastoni (same suit!) -> Invalid!
    game.waste = [makeCardId(3, 6)];
    const movedSameSuit = moveWasteToTableau(game, 0);
    expect(movedSameSuit).toBeNull();

    // Try placing 8 di Coppe (higher rank) -> Invalid!
    game.waste = [makeCardId(1, 8)];
    const movedHigher = moveWasteToTableau(game, 0);
    expect(movedHigher).toBeNull();
  });

  it('allows moving sequences between tableau columns', () => {
    const game = createSolitaireGame(12345);
    // Col 0 has 7 Bastoni and 6 Coppe
    game.tableau[0] = [makeCardId(3, 7), makeCardId(1, 6)];
    // Col 1 has 8 Spade (suit 2, rank 8)
    game.tableau[1] = [makeCardId(2, 8)];

    // Move sequence [7 Bastoni, 6 Coppe] onto Col 1 (8 Spade) -> Valid!
    const movedSeq = moveTableauToTableau(game, 0, 0, 1);
    expect(movedSeq).not.toBeNull();
    expect(movedSeq!.tableau[0].length).toBe(0); // Col 0 is now empty
    expect(movedSeq!.tableau[1].length).toBe(3); // 8 Spade, 7 Bastoni, 6 Coppe
  });
});
