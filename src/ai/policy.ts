import type { CardId } from '../core/cards/types';
import type { ScopaRulesConfig } from '../core/rules/scopa/config';
import { PRNG } from '../core/rng/prng';
import { evaluateAllMoves } from './heuristics';

export type AIDifficulty = 'relaxed' | 'standard' | 'expert';

export interface AIMoveSelection {
  card: CardId;
  captureOptionIndex?: number;
}

/**
 * Chooses an AI move given the player's hand, current table, and difficulty level.
 */
export function chooseAIMove(
  hand: readonly CardId[],
  tableCards: readonly CardId[],
  config: ScopaRulesConfig,
  difficulty: AIDifficulty,
  prng: PRNG = new PRNG(Date.now()),
  isFinalPlay: boolean = false
): AIMoveSelection {
  if (hand.length === 0) {
    throw new Error('Cannot choose move with empty hand');
  }

  const moves = evaluateAllMoves(hand, tableCards, config, isFinalPlay);
  if (moves.length === 0) {
    return { card: hand[0] };
  }

  // 1. Relaxed: uniform random choice
  if (difficulty === 'relaxed') {
    const idx = prng.nextInt(0, moves.length - 1);
    return {
      card: moves[idx].card,
      captureOptionIndex: moves[idx].captureOptionIndex,
    };
  }

  // 2. Standard: pick top evaluated move (with slight noise for variance)
  if (difficulty === 'standard') {
    // If top 2 moves are very close, randomly pick between them
    const topScore = moves[0].score;
    const candidates = moves.filter((m) => m.score >= topScore - 5);
    const chosen = candidates[prng.nextInt(0, candidates.length - 1)];
    return {
      card: chosen.card,
      captureOptionIndex: chosen.captureOptionIndex,
    };
  }

  // 3. Expert: deterministic optimal selection with deep evaluation
  const bestMove = moves[0];
  return {
    card: bestMove.card,
    captureOptionIndex: bestMove.captureOptionIndex,
  };
}
