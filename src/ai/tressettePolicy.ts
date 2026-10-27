import { rankOf, suitOf, type CardId } from '../core/cards/types';
import {
  sideOfSeat,
  type TressetteMatchState,
} from '../core/engine/tressette/engine';
import {
  getLegalTressetteMoves,
  resolveTressetteTrick,
  tressettePowerOf,
  tressetteTerziOf,
  type TressetteSignal,
} from '../core/rules/tressette/types';

export interface TressetteAiDecision {
  card: CardId;
  signal: TressetteSignal;
}

/**
 * Exact Minimax Endgame Solver ("coda") for 2-player Tressette when the Tallone is empty
 * and <= 6 cards remain per player (inspired by diegoami/Tressette engine.js).
 */
function solveEndgame2P(
  myHand: readonly CardId[],
  oppHand: readonly CardId[],
  ledCard: CardId | null,
  isPerdere: boolean,
  depthLimit: number = 10
): { bestCard: CardId; score: number } {
  const legal = ledCard
    ? getLegalTressetteMoves(myHand, [{ seat: 0, card: ledCard }])
    : [...myHand];

  if (legal.length === 1 && depthLimit <= 0) {
    return { bestCard: legal[0], score: 0 };
  }

  let bestCard = legal[0];
  let bestScore = isPerdere ? Infinity : -Infinity;

  for (const c of legal) {
    const nextMy = myHand.filter((x) => x !== c);
    let val = 0;

    if (ledCard === null) {
      // We are leading the trick; opponent will respond optimally
      const oppLegal = getLegalTressetteMoves(oppHand, [{ seat: 0, card: c }]);
      let worstForUs = isPerdere ? -Infinity : Infinity;

      for (const oppC of oppLegal) {
        const nextOpp = oppHand.filter((x) => x !== oppC);
        const sameSuit = suitOf(oppC) === suitOf(c);
        const weWin = !sameSuit || tressettePowerOf(c) > tressettePowerOf(oppC);
        const trickTerzi =
          tressetteTerziOf(c, isPerdere) +
          tressetteTerziOf(oppC, isPerdere) +
          (nextMy.length === 0 ? 3 : 0); // +3 terzi for Ultima!

        const delta = weWin ? trickTerzi : -trickTerzi;
        let future = 0;
        if (nextMy.length > 0 && depthLimit > 1) {
          if (weWin) {
            future = solveEndgame2P(nextMy, nextOpp, null, isPerdere, depthLimit - 1).score;
          } else {
            // Opponent leads next trick
            future = -solveEndgame2P(nextOpp, nextMy, null, isPerdere, depthLimit - 1).score;
          }
        }
        const total = delta + future;
        if (isPerdere) {
          if (total > worstForUs) worstForUs = total;
        } else {
          if (total < worstForUs) worstForUs = total;
        }
      }
      val = worstForUs;
    } else {
      // We are answering ledCard
      const sameSuit = suitOf(c) === suitOf(ledCard);
      const weWin = sameSuit && tressettePowerOf(c) > tressettePowerOf(ledCard);
      const trickTerzi =
        tressetteTerziOf(ledCard, isPerdere) +
        tressetteTerziOf(c, isPerdere) +
        (nextMy.length === 0 ? 3 : 0);

      const delta = weWin ? trickTerzi : -trickTerzi;
      let future = 0;
      if (nextMy.length > 0 && depthLimit > 1) {
        if (weWin) {
          future = solveEndgame2P(nextMy, oppHand, null, isPerdere, depthLimit - 1).score;
        } else {
          future = -solveEndgame2P(oppHand, nextMy, null, isPerdere, depthLimit - 1).score;
        }
      }
      val = delta + future;
    }

    if (isPerdere) {
      if (val < bestScore) {
        bestScore = val;
        bestCard = c;
      }
    } else {
      if (val > bestScore) {
        bestScore = val;
        bestCard = c;
      }
    }
  }

  return { bestCard, score: bestScore };
}

/**
 * Computes an appropriate partner signal (Busso, Striscio, Volo) when leading a trick in 4P Tressette.
 */
function computeLeadSignal(
  hand: readonly CardId[],
  playedCard: CardId,
  partnerships: boolean,
  isPerdere: boolean
): TressetteSignal {
  if (!partnerships || isPerdere) return null;
  const s = suitOf(playedCard);
  const remainingOfSuit = hand.filter((c) => c !== playedCard && suitOf(c) === s);

  // Vólo: no more cards of this suit left in hand
  if (remainingOfSuit.length === 0) {
    return 'volo';
  }

  const r = rankOf(playedCard);
  // Busso: leading a 3 or 2 or low card when holding another high card or wanting partner's best
  if (r === 3 || r === 2 || remainingOfSuit.some((c) => rankOf(c) <= 3)) {
    return 'busso';
  }

  // Striscio: holding 2+ more low cards of the same suit
  if (remainingOfSuit.length >= 2) {
    return 'striscio';
  }

  return null;
}

/**
 * Selects the best card (and optional partner signal) for an AI seat in Tressette.
 */
export function selectTressetteAiMove(
  state: TressetteMatchState,
  seat: number
): TressetteAiDecision {
  const hand = state.hands[seat];
  const legal = getLegalTressetteMoves(hand, state.currentTrick);
  const difficulty = state.setup.seats[seat]?.aiDifficulty ?? 'standard';
  const isLeading = state.currentTrick.length === 0;
  const isPerdere = state.isPerdere;

  if (legal.length === 1) {
    return {
      card: legal[0],
      signal: isLeading
        ? computeLeadSignal(hand, legal[0], state.partnerships, isPerdere)
        : null,
    };
  }

  // Relaxed difficulty: simple friendly play
  if (difficulty === 'relaxed') {
    const sorted = [...legal].sort((a, b) => tressettePowerOf(a) - tressettePowerOf(b));
    const chosen = isPerdere ? sorted[0] : sorted[sorted.length - 1];
    return {
      card: chosen,
      signal: isLeading
        ? computeLeadSignal(hand, chosen, state.partnerships, isPerdere)
        : null,
    };
  }

  // Exact Endgame Solver ("coda") in 2-player mode when Tallone is empty and <= 5 cards left
  if (
    difficulty === 'expert' &&
    state.setup.seats.length === 2 &&
    state.deck.length === 0 &&
    hand.length <= 5
  ) {
    const oppSeat = 1 - seat;
    const oppHand = state.hands[oppSeat];
    const ledCard = state.currentTrick.length === 1 ? state.currentTrick[0].card : null;
    const solved = solveEndgame2P(hand, oppHand, ledCard, isPerdere, 6);
    return {
      card: solved.bestCard,
      signal: null,
    };
  }

  // Heuristic for A Perdere (Traversone / Rovescino)
  if (isPerdere) {
    if (isLeading) {
      // Lead the lowest power card to avoid winning tricks
      const sorted = [...legal].sort((a, b) => tressettePowerOf(a) - tressettePowerOf(b));
      return { card: sorted[0], signal: null };
    } else {
      const ledSuit = suitOf(state.currentTrick[0].card);
      const currentWin = resolveTressetteTrick(state.currentTrick);
      const highestLedPower = tressettePowerOf(currentWin.card);

      if (suitOf(legal[0]) === ledSuit) {
        // Must follow suit: play the highest card that still DUCKS under highestLedPower!
        const ducking = legal
          .filter((c) => tressettePowerOf(c) < highestLedPower)
          .sort((a, b) => tressettePowerOf(b) - tressettePowerOf(a));
        if (ducking.length > 0) {
          return { card: ducking[0], signal: null };
        }
        // Forced to overtake: play lowest overtaking card
        const sorted = [...legal].sort((a, b) => tressettePowerOf(a) - tressettePowerOf(b));
        return { card: sorted[0], signal: null };
      } else {
        // Off-suit (piombo): immediately dump the Asso di Bastoni (30) or highest dangerous card!
        if (legal.includes(30)) {
          return { card: 30, signal: null };
        }
        const sorted = [...legal].sort((a, b) => {
          const tDiff = tressetteTerziOf(b, true) - tressetteTerziOf(a, true);
          if (tDiff !== 0) return tDiff;
          return tressettePowerOf(b) - tressettePowerOf(a);
        });
        return { card: sorted[0], signal: null };
      }
    }
  }

  // Standard / Expert Normal Tressette Strategy
  if (isLeading) {
    // 1. Look for master cards (3s, or 2s when the 3 has already been captured)
    const allPlayed = new Set<CardId>(state.capturedBySide.flat());
    for (const c of legal) {
      const r = rankOf(c);
      const s = suitOf(c);
      const base = Math.floor(c / 10) * 10;
      const threeCard = base + 2; // rank 3
      const twoCard = base + 1;   // rank 2
      if (r === 3) {
        // Leading a 3 is a guaranteed master (especially great if we also have the Ace or 2 of that suit)
        const sameSuit = hand.filter((x) => suitOf(x) === s);
        if (sameSuit.some((x) => rankOf(x) === 1 || rankOf(x) === 2) || state.partnerships) {
          return {
            card: c,
            signal: computeLeadSignal(hand, c, state.partnerships, false),
          };
        }
      }
      if (r === 2 && allPlayed.has(threeCard)) {
        return {
          card: c,
          signal: computeLeadSignal(hand, c, state.partnerships, false),
        };
      }
      if (r === 1 && allPlayed.has(threeCard) && allPlayed.has(twoCard)) {
        return {
          card: c,
          signal: computeLeadSignal(hand, c, state.partnerships, false),
        };
      }
    }

    // 2. Otherwise lead a non-Ace card (avoid leading a naked Ace that an opponent's 2 or 3 can eat!)
    const nonAces = legal.filter((c) => rankOf(c) !== 1);
    const pool = nonAces.length > 0 ? nonAces : legal;
    // Prefer a low card from our longest suit
    const sorted = [...pool].sort((a, b) => {
      const tDiff = tressetteTerziOf(a) - tressetteTerziOf(b);
      if (tDiff !== 0) return tDiff;
      return tressettePowerOf(a) - tressettePowerOf(b);
    });
    const chosen = sorted[0];
    return {
      card: chosen,
      signal: computeLeadSignal(hand, chosen, state.partnerships, false),
    };
  } else {
    // Following in a trick
    const ledPlay = state.currentTrick[0];
    const ledSuit = suitOf(ledPlay.card);
    const currentWin = resolveTressetteTrick(state.currentTrick);
    const mySide = sideOfSeat(state, seat);
    const winningSide = sideOfSeat(state, currentWin.seat);
    const partnerWinning = state.partnerships && winningSide === mySide;

    const followingSuit = suitOf(legal[0]) === ledSuit;

    if (!followingSuit) {
      // Cannot win off-suit: if partner is winning and no opponent after us can beat them, we can fatten with an Ace or figure, otherwise dump a 0-point liscio!
      const isLastToPlay = state.currentTrick.length === state.setup.seats.length - 1;
      if (partnerWinning && isLastToPlay) {
        const aces = legal.filter((c) => rankOf(c) === 1);
        if (aces.length > 0) return { card: aces[0], signal: null };
      }
      const lisci = legal
        .filter((c) => tressetteTerziOf(c) === 0)
        .sort((a, b) => tressettePowerOf(a) - tressettePowerOf(b));
      if (lisci.length > 0) return { card: lisci[0], signal: null };
      const lowest = [...legal].sort((a, b) => tressettePowerOf(a) - tressettePowerOf(b));
      return { card: lowest[0], signal: null };
    }

    // We are following the led suit
    const winningCards = legal
      .filter((c) => tressettePowerOf(c) > tressettePowerOf(currentWin.card))
      .sort((a, b) => tressettePowerOf(b) - tressettePowerOf(a));

    // Check if partner led with "Busso" -> partner commands us to take with our highest card!
    if (
      state.partnerships &&
      sideOfSeat(state, ledPlay.seat) === mySide &&
      ledPlay.signal === 'busso' &&
      winningCards.length > 0
    ) {
      return { card: winningCards[0], signal: null };
    }

    const trickTerzi = state.currentTrick.reduce(
      (sum, t) => sum + tressetteTerziOf(t.card),
      0
    );

    if (partnerWinning) {
      const isLastToPlay = state.currentTrick.length === state.setup.seats.length - 1;
      if (isLastToPlay) {
        // Partner already won the trick! Fatten with an Ace if we have one (unless Ace would overtake partner and we don't care, either way our team gets it)
        const aces = legal.filter((c) => rankOf(c) === 1);
        if (aces.length > 0) return { card: aces[0], signal: null };
      }
      // Play our lowest liscio to let partner keep the trick
      const lowest = [...legal].sort((a, b) => {
        const tDiff = tressetteTerziOf(a) - tressetteTerziOf(b);
        if (tDiff !== 0) return tDiff;
        return tressettePowerOf(a) - tressettePowerOf(b);
      });
      return { card: lowest[0], signal: null };
    }

    // Opponent is currently winning the trick: try to overtake if we can!
    if (winningCards.length > 0) {
      const isLastToPlay = state.currentTrick.length === state.setup.seats.length - 1;
      if (isLastToPlay) {
        // Last to play: win as cheaply as possible (or with an Ace if an Ace wins it!)
        const aceWin = winningCards.find((c) => rankOf(c) === 1);
        if (aceWin) return { card: aceWin, signal: null };
        return { card: winningCards[winningCards.length - 1], signal: null };
      }
      // Not last to play: win with highest master (3 or 2) if trick has value
      if (trickTerzi >= 1 || rankOf(winningCards[0]) === 3) {
        return { card: winningCards[0], signal: null };
      }
      return { card: winningCards[winningCards.length - 1], signal: null };
    }

    // Cannot overtake opponent: dump lowest 0-point liscio (avoid giving away an Ace!)
    const nonAces = legal.filter((c) => rankOf(c) !== 1);
    const pool = nonAces.length > 0 ? nonAces : legal;
    const lowest = [...pool].sort((a, b) => {
      const tDiff = tressetteTerziOf(a) - tressetteTerziOf(b);
      if (tDiff !== 0) return tDiff;
      return tressettePowerOf(a) - tressettePowerOf(b);
    });
    return { card: lowest[0], signal: null };
  }
}
