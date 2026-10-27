import { isCoin, isSevenBello, rankOf, valueOf, type CardId } from '../core/cards/types';
import { findLegalCaptures, type CaptureOption } from '../core/rules/scopa/capture';
import type { ScopaRulesConfig } from '../core/rules/scopa/config';

export interface EvaluatedMove {
  card: CardId;
  captureOptionIndex?: number;
  option?: CaptureOption;
  score: number;
}

/**
 * Evaluates the immediate value of a capture move in Scopa.
 */
export function evaluateCaptureMove(
  playedCard: CardId,
  tableCards: readonly CardId[],
  option: CaptureOption,
  config: ScopaRulesConfig,
  isFinalPlay: boolean
): number {
  let score = 10; // Base score for making any capture

  // 1. Scopa bonus (clearing table during active play)
  const remainingTableCount = tableCards.length - option.capturedCards.length;
  if (remainingTableCount === 0 && !isFinalPlay) {
    score += 150; // Sweeping table is highest priority
  }

  // 2. Settebello capture (7 of Denari)
  if (option.capturedCards.some(isSevenBello) || isSevenBello(playedCard)) {
    score += 80;
  }

  // 3. Re Bello capture (King of Denari, if enabled)
  if (config.reBello && (option.capturedCards.some((c) => rankOf(c) === 10 && isCoin(c)))) {
    score += 40;
  }

  // 4. Denari count
  const coinCount =
    (isCoin(playedCard) ? 1 : 0) + option.capturedCards.filter(isCoin).length;
  score += coinCount * 15;

  // 5. Total cards count
  score += (1 + option.capturedCards.length) * 5;

  // 6. High Primiera cards (7, 6, Ace)
  for (const c of [...option.capturedCards, playedCard]) {
    const r = rankOf(c);
    if (r === 7) score += 20;
    else if (r === 6) score += 15;
    else if (r === 1) score += 12;
  }

  return score;
}

/**
 * Evaluates the safety of discarding a card to the table when no capture is available.
 * Lower risk = higher score.
 */
export function evaluateDiscardMove(
  card: CardId,
  tableCards: readonly CardId[]
): number {
  let score = 0;
  const rank = rankOf(card);
  const val = valueOf(card);

  // Avoid giving away Settebello!
  if (isSevenBello(card)) {
    score -= 100;
  }

  // Avoid giving away Coins
  if (isCoin(card)) {
    score -= 25;
  }

  // Avoid giving away high Primiera cards (7s, 6s, Aces)
  if (rank === 7) score -= 30;
  else if (rank === 6) score -= 20;
  else if (rank === 1) score -= 15;

  // Prefer discarding low or uncoordinated cards
  if (rank <= 3) score += 10;

  // Avoid leaving easy sums on table (e.g. table has 3, leaving 4 makes 7)
  for (const t of tableCards) {
    const sum = val + valueOf(t);
    if (sum <= 10) {
      score -= 5;
    }
  }

  return score;
}

/**
 * Returns all candidate moves with their heuristic scores.
 */
export function evaluateAllMoves(
  hand: readonly CardId[],
  tableCards: readonly CardId[],
  config: ScopaRulesConfig,
  isFinalPlay: boolean = false
): EvaluatedMove[] {
  const moves: EvaluatedMove[] = [];

  for (const card of hand) {
    const options = findLegalCaptures(card, tableCards, config);

    if (options.length > 0) {
      for (let i = 0; i < options.length; i++) {
        const score = evaluateCaptureMove(card, tableCards, options[i], config, isFinalPlay);
        moves.push({
          card,
          captureOptionIndex: i,
          option: options[i],
          score,
        });
      }
    } else {
      const score = evaluateDiscardMove(card, tableCards);
      moves.push({
        card,
        score,
      });
    }
  }

  // Sort descending by score
  moves.sort((a, b) => b.score - a.score);
  return moves;
}
