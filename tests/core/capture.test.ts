import { describe, it, expect } from 'vitest';
import { findLegalCaptures } from '../../src/core/rules/scopa/capture';
import { PRESET_CONFIGS } from '../../src/core/rules/scopa/config';
import { makeCardId } from '../../src/core/cards/types';

describe('Scopa Capture Combinatorics & Rules', () => {
  const classic = PRESET_CONFIGS.classic;

  it('mandates exact-single-card match priority over sum combination', () => {
    // Played card: 7 of Swords (makeCardId(2, 7))
    // Table cards: 7 of Coins (makeCardId(0, 7)), 3 of Cups (makeCardId(1, 3)), 4 of Batons (makeCardId(3, 4))
    const played = makeCardId(2, 7);
    const table = [
      makeCardId(0, 7), // Exact match
      makeCardId(1, 3), // 3
      makeCardId(3, 4), // 4 (3+4 = 7)
    ];

    const options = findLegalCaptures(played, table, classic);

    // EXACT MATCH PRIORITY: MUST ONLY return the single 7!
    expect(options.length).toBe(1);
    expect(options[0].capturedCards).toEqual([makeCardId(0, 7)]);
  });

  it('allows multi-card sum capture when no exact single-card match is available', () => {
    // Played card: 7 of Swords
    // Table cards: 3 of Cups, 4 of Batons, 2 of Coins, 6 of Batons
    const played = makeCardId(2, 7);
    const table = [
      makeCardId(1, 3), // 3
      makeCardId(3, 4), // 4 (3 + 4 = 7)
      makeCardId(0, 2), // 2
      makeCardId(3, 6), // 6
    ];

    const options = findLegalCaptures(played, table, classic);

    expect(options.length).toBe(1);
    expect(options[0].capturedCards).toEqual([makeCardId(1, 3), makeCardId(3, 4)]);
  });

  it('offers multiple capture choices when multiple sums exist (e.g. 7 = 5+2 or 4+3)', () => {
    // Played card: 7 of Swords (val 7)
    // Table cards: 5, 2, 4, 3
    // Combinations: [5, 2] and [4, 3]
    const played = makeCardId(2, 7);
    const c5 = makeCardId(0, 5);
    const c2 = makeCardId(1, 2);
    const c4 = makeCardId(2, 4);
    const c3 = makeCardId(3, 3);
    const table = [c5, c2, c4, c3];

    const options = findLegalCaptures(played, table, classic);
    expect(options.length).toBe(2);
    expect(options[0].capturedCards).toEqual([c5, c2]);
    expect(options[1].capturedCards).toEqual([c4, c3]);
  });

  it('returns empty array when no capture is possible (discard to table)', () => {
    // Played card: 2
    // Table: 5, 6, 7
    const played = makeCardId(0, 2);
    const table = [makeCardId(1, 5), makeCardId(2, 6), makeCardId(3, 7)];

    const options = findLegalCaptures(played, table, classic);
    expect(options.length).toBe(0);
  });

  it('handles Asso Pigliatutto / Ace sweep correctly', () => {
    const assi = PRESET_CONFIGS.assi;
    const playedAce = makeCardId(0, 1); // Ace of Coins

    // Scenario A: Table has no Ace -> Sweeps all cards
    const tableWithoutAce = [
      makeCardId(1, 5),
      makeCardId(2, 3),
      makeCardId(3, 8),
    ];
    const sweepOptions = findLegalCaptures(playedAce, tableWithoutAce, assi);
    expect(sweepOptions.length).toBe(1);
    expect(sweepOptions[0].isAceSweep).toBe(true);
    expect(sweepOptions[0].capturedCards).toEqual(tableWithoutAce);

    // Scenario B: Table has an Ace -> Takes only the Ace
    const aceOnTable = makeCardId(2, 1);
    const tableWithAce = [aceOnTable, makeCardId(1, 5)];
    const singleAceOptions = findLegalCaptures(playedAce, tableWithAce, assi);
    expect(singleAceOptions.length).toBe(1);
    expect(singleAceOptions[0].isAceSweep).toBe(false);
    expect(singleAceOptions[0].capturedCards).toEqual([aceOnTable]);
  });

  it('handles Scopa di Quindici (sum to 15)', () => {
    const quindici = PRESET_CONFIGS.quindici;
    // Played card: King (10)
    // Table: 5 of Coins, 7 of Swords
    // Needs 15 - 10 = 5 from table
    const king = makeCardId(0, 10);
    const five = makeCardId(1, 5);
    const seven = makeCardId(2, 7);
    const table = [five, seven];

    const options = findLegalCaptures(king, table, quindici);
    expect(options.length).toBe(1);
    expect(options[0].capturedCards).toEqual([five]);
  });

  it('handles Cirulla Matta (7 of Coppe) wild card substitution', () => {
    const cirulla = PRESET_CONFIGS.cirulla;
    const matta = makeCardId(1, 7); // 7 of Cups (Matta)
    const table = [makeCardId(0, 8)]; // Fante (8) on table

    // The Matta can represent an 8 to capture the 8!
    const options = findLegalCaptures(matta, table, cirulla);
    expect(options.some((opt) => opt.mattaValue === 8)).toBe(true);
  });
});
