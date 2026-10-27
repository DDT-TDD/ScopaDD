import type { CardId } from '../../cards/types';
import type { ScopaRulesConfig } from '../../rules/scopa/config';
import type { HandScoreResult } from '../../rules/scopa/scoring';

export type PlayerKind = 'human' | 'ai';
export type AIDifficulty = 'relaxed' | 'standard' | 'expert';

export interface SeatConfig {
  kind: PlayerKind;
  name: string;
  avatar: string;
  aiDifficulty?: AIDifficulty;
}

export type ScopaMatchPhase = 'dealing' | 'playing' | 'hand-ended' | 'match-ended';

export interface ScopaMatchSetup {
  config: ScopaRulesConfig;
  seats: SeatConfig[];
  seed: number;
}

export interface ScopaMatchState {
  setup: ScopaMatchSetup;
  phase: ScopaMatchPhase;
  handIndex: number;
  dealerSeat: number;
  activeSeat: number;
  deck: CardId[];
  hands: CardId[][];
  table: CardId[];
  capturedBySide: CardId[][];
  scopeCountBySide: number[];
  cumulativeScores: number[];
  lastCaptureSeat: number | null;
  lastCaptureSide: number | null;
  handScoreResult: HandScoreResult | null;
  winner: number | null; // side index, or -1 for tie
  commandSeq: number;
}

/**
 * Returns the side (scoring unit) index for a given seat.
 * In 2-player or 4-player individual games: side === seat.
 * In 4-player partnership: seats 0 & 2 are side 0, seats 1 & 3 are side 1.
 */
export function sideOfSeat(seat: number, config: ScopaRulesConfig): number {
  if (config.partnerships && config.playerCount === 4) {
    return seat % 2; // 0 for seats 0 & 2, 1 for seats 1 & 3
  }
  return seat;
}

/**
 * Returns the number of sides (scoring teams/players).
 */
export function sideCountOf(config: ScopaRulesConfig): number {
  if (config.partnerships && config.playerCount === 4) {
    return 2;
  }
  return config.playerCount;
}
