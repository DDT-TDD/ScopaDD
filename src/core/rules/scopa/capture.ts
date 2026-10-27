import { isMatta, rankOf, valueOf, type CardId } from '../../cards/types';
import type { ScopaRulesConfig } from './config';

export interface CaptureOption {
  /** The cards from the table that will be captured */
  capturedCards: CardId[];
  /** Is this an Ace sweep of the entire table? */
  isAceSweep?: boolean;
  /** In Cirulla, the chosen value for the Matta if involved */
  mattaValue?: number;
}

/**
 * Finds all subsets of array summing to target.
 */
function findSubsetsSummingTo(
  cards: readonly CardId[],
  target: number,
  cardValueFn: (c: CardId) => number
): CardId[][] {
  const results: CardId[][] = [];

  function backtrack(index: number, currentSum: number, currentCards: CardId[]) {
    if (currentSum === target && currentCards.length > 0) {
      results.push([...currentCards]);
      return;
    }
    if (currentSum > target || index >= cards.length) {
      return;
    }

    for (let i = index; i < cards.length; i++) {
      const val = cardValueFn(cards[i]);
      if (currentSum + val <= target) {
        currentCards.push(cards[i]);
        backtrack(i + 1, currentSum + val, currentCards);
        currentCards.pop();
      }
    }
  }

  backtrack(0, 0, []);
  return results;
}

/**
 * Finds all legal capture options for a card played from hand against the table cards.
 */
export function findLegalCaptures(
  playedCard: CardId,
  tableCards: readonly CardId[],
  config: ScopaRulesConfig
): CaptureOption[] {
  if (tableCards.length === 0) return [];

  const playedRank = rankOf(playedCard);
  const playedVal = valueOf(playedCard);

  // 1. Asso Pigliatutto / Ace Sweep
  if (config.aceSweep && playedRank === 1) {
    const acesOnTable = tableCards.filter((c) => rankOf(c) === 1);
    if (acesOnTable.length > 0) {
      // Must take single Ace from table (or choose which Ace if multiple)
      return acesOnTable.map((ace) => ({
        capturedCards: [ace],
        isAceSweep: false,
      }));
    } else {
      // Sweeps all cards from table
      return [
        {
          capturedCards: [...tableCards],
          isAceSweep: true,
        },
      ];
    }
  }

  // 2. Standard Scopa Capture (Mode: 'sum')
  if (config.captureMode === 'sum') {
    // Check for exact single-card matches first
    const exactMatches = tableCards.filter((c) => valueOf(c) === playedVal);

    if (config.exactMatchPriority && exactMatches.length > 0) {
      // Rule: Single card capture MUST be taken over sum combinations!
      return exactMatches.map((c) => ({ capturedCards: [c] }));
    }

    const options: CaptureOption[] = [];

    // Add exact matches if priority wasn't strictly exclusive (or if no sums exist)
    for (const exact of exactMatches) {
      options.push({ capturedCards: [exact] });
    }

    // Find multi-card sum combinations
    const sumCombinations = findSubsetsSummingTo(tableCards, playedVal, valueOf).filter(
      (subset) => subset.length >= 2
    );

    for (const subset of sumCombinations) {
      options.push({ capturedCards: subset });
    }

    return options;
  }

  // 3. Scopa di Quindici (Mode: 'quindici')
  // Played card + captured cards must sum to 15
  if (config.captureMode === 'quindici') {
    const targetSum = 15 - playedVal;
    if (targetSum <= 0) return [];

    const subsets = findSubsetsSummingTo(tableCards, targetSum, valueOf);
    return subsets.map((subset) => ({ capturedCards: subset }));
  }

  // 4. Cirulla (Mode: 'cirulla')
  // Combines sum-to-15 with standard matching, plus Matta wild card substitutions
  if (config.captureMode === 'cirulla') {
    const options: CaptureOption[] = [];
    const mattaPlayed = isMatta(playedCard);

    const testValues = mattaPlayed
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      : [playedVal];

    for (const testVal of testValues) {
      // Check 15-sum: testVal + tableSum === 15
      const targetFor15 = 15 - testVal;
      if (targetFor15 > 0) {
        const subsets15 = findSubsetsSummingTo(tableCards, targetFor15, valueOf);
        for (const subset of subsets15) {
          options.push({
            capturedCards: subset,
            mattaValue: mattaPlayed ? testVal : undefined,
          });
        }
      }

      // Check standard capture: tableSum === testVal
      const exactMatches = tableCards.filter((c) => valueOf(c) === testVal);
      for (const exact of exactMatches) {
        options.push({
          capturedCards: [exact],
          mattaValue: mattaPlayed ? testVal : undefined,
        });
      }

      const sumSubsets = findSubsetsSummingTo(tableCards, testVal, valueOf).filter(
        (s) => s.length >= 2
      );
      for (const s of sumSubsets) {
        options.push({
          capturedCards: s,
          mattaValue: mattaPlayed ? testVal : undefined,
        });
      }
    }

    // Deduplicate options by sorting captured card IDs and mattaValue
    const seen = new Set<string>();
    const uniqueOptions: CaptureOption[] = [];
    for (const opt of options) {
      const cardKey = [...opt.capturedCards].sort((a, b) => a - b).join(',');
      const key = `${opt.mattaValue ?? 'val'}:${cardKey}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueOptions.push(opt);
      }
    }

    return uniqueOptions;
  }

  return [];
}
