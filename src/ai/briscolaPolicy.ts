import { suitOf, type CardId } from '../core/cards/types';
import {
  briscolaPointsOf,
  briscolaPowerOf,
  resolveBriscolaTrick,
} from '../core/rules/briscola/types';
import type { BriscolaMatchState } from '../core/engine/briscola/engine';

/**
 * Intelligent AI policy for Briscola (1v1 and 2v2 Partnership).
 * Supports 'relaxed' (beginner/kids), 'standard' (heuristic), and 'expert' (tactical).
 */
export function chooseBriscolaAIMove(
  state: BriscolaMatchState,
  seat: number,
  difficultyOverride?: 'relaxed' | 'standard' | 'expert'
): CardId {
  const hand = state.hands[seat] ?? [];
  if (hand.length === 0) {
    throw new Error(`AI seat ${seat} has an empty hand`);
  }
  if (hand.length === 1) {
    return hand[0];
  }

  const diff = difficultyOverride ?? state.setup.seats[seat]?.aiDifficulty ?? 'standard';
  if (diff === 'relaxed') {
    // Gentle play for young children: prefer playing low-point or random legal card
    return hand[Math.floor(Math.random() * hand.length)];
  }

  const trump = state.trumpSuit;
  const trick = state.currentTrick;
  const numSeats = state.setup.seats.length;
  const mySide = numSeats === 4 ? seat % 2 : seat;

  // CASE 1: Leading the trick (first to play)
  if (trick.length === 0) {
    // Prefer leading a 0-point non-trump card (liscio) so we don't gift points
    const scored = hand.map((c) => {
      const isTrump = suitOf(c) === trump;
      const pts = briscolaPointsOf(c);
      const pwr = briscolaPowerOf(c);
      let score = 0;

      if (!isTrump && pts === 0) {
        score = 100 - pwr; // Best to lead low liscio
      } else if (!isTrump && pts <= 4) {
        score = 60 - pts * 5; // Small figure if no lisci
      } else if (isTrump && pts === 0) {
        score = 40 - pwr; // Small trump
      } else if (!isTrump && pts >= 10) {
        score = 10; // Avoid leading Asso/Tre dry!
      } else {
        score = 5; // High trump last resort
      }
      return { card: c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].card;
  }

  // CASE 2: Following in the trick
  const currentTrickPts = trick.reduce((s, t) => s + briscolaPointsOf(t.card), 0);

  const scored = hand.map((c) => {
    const hypotheticalTrick = [...trick, { seat, card: c }];
    const winnerPlay = resolveBriscolaTrick(hypotheticalTrick, trump);
    const winningSide = numSeats === 4 ? winnerPlay.seat % 2 : winnerPlay.seat;
    const weWin = winningSide === mySide;
    const isTrump = suitOf(c) === trump;
    const myPts = briscolaPointsOf(c);
    const totalPts = currentTrickPts + myPts;

    let score = 0;

    if (weWin) {
      if (winnerPlay.seat === seat) {
        // I am taking the trick with this card
        if (!isTrump) {
          // Winning same-suit (strozzo / sorpasso) is awesome!
          score = 120 + totalPts * 6 - briscolaPowerOf(c);
        } else {
          // Winning with a trump card
          if (currentTrickPts >= 10) {
            // Worth spending a trump to capture an Ace or Three!
            score = 110 + totalPts * 4 - myPts * 2;
          } else if (currentTrickPts >= 2 && myPts === 0) {
            // Using a small trump to take a figure
            score = 75 + totalPts * 3;
          } else {
            // Wasting a trump on 0 points
            score = 25 - myPts * 3 - briscolaPowerOf(c) * 2;
          }
        }
      } else {
        // In 2v2, my partner is currently winning the trick!
        // Fattening (caricare) the partner's trick if we are last or confident
        if (!isTrump && myPts >= 10 && trick.length === numSeats - 1) {
          score = 140 + myPts * 5;
        } else if (!isTrump && myPts === 0) {
          score = 80;
        } else {
          score = 60 - (isTrump ? 30 : 0);
        }
      }
    } else {
      // Opponent wins the trick if we play this card -> throw lowest value liscio!
      score = -myPts * 12 - (isTrump ? 45 : 0) - briscolaPowerOf(c);
    }

    return { card: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].card;
}
