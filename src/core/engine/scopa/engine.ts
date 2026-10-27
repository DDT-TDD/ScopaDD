import { FULL_DECK, rankOf, type CardId } from '../../cards/types';
import { PRNG } from '../../rng/prng';
import { findLegalCaptures, type CaptureOption } from '../../rules/scopa/capture';
import { evaluateScopaHand, type HandScoreResult } from '../../rules/scopa/scoring';
import {
  sideCountOf,
  sideOfSeat,
  type ScopaMatchSetup,
  type ScopaMatchState,
} from './state';

export type ScopaCommand =
  | { type: 'play'; seat: number; card: CardId; captureOptionIndex?: number; seq: number }
  | { type: 'advance-hand'; seq: number };

export type ScopaEvent =
  | { type: 'DealVoidedKings'; kingsCount: number }
  | { type: 'HandDealt'; handIndex: number; dealerSeat: number; table: CardId[] }
  | { type: 'RoundDealt'; roundIndex: number }
  | { type: 'CardPlayed'; seat: number; card: CardId }
  | { type: 'CardsCaptured'; seat: number; side: number; playedCard: CardId; capturedCards: CardId[] }
  | { type: 'TableCardPlaced'; seat: number; card: CardId }
  | { type: 'ScopaScored'; seat: number; side: number; totalScope: number }
  | { type: 'RemainingTableClaimed'; side: number; cards: CardId[] }
  | { type: 'HandEnded'; handIndex: number; result: HandScoreResult; cumulativeScores: number[] }
  | { type: 'MatchEnded'; winner: number; cumulativeScores: number[] };

/**
 * Creates a fresh Scopa match state from setup.
 */
export function createScopaMatch(setup: ScopaMatchSetup): ScopaMatchState {
  const prng = new PRNG(setup.seed);
  const config = setup.config;
  const numSeats = config.playerCount;
  const numSides = sideCountOf(config);

  const state: ScopaMatchState = {
    setup,
    phase: 'playing',
    handIndex: 0,
    dealerSeat: numSeats - 1, // Human seat 0 is after dealer, so Human plays first on Hand #1!
    activeSeat: 0,
    deck: [],
    hands: Array.from({ length: numSeats }, () => []),
    table: [],
    capturedBySide: Array.from({ length: numSides }, () => []),
    scopeCountBySide: Array.from({ length: numSides }, () => 0),
    cumulativeScores: Array.from({ length: numSides }, () => 0),
    lastCaptureSeat: null,
    lastCaptureSide: null,
    handScoreResult: null,
    winner: null,
    commandSeq: 0,
  };

  dealNewHand(state, prng);
  return state;
}

/**
 * Deals a new hand, handling Kings redeal if enabled.
 */
function dealNewHand(state: ScopaMatchState, prng: PRNG): ScopaEvent[] {
  const config = state.setup.config;
  const numSeats = config.playerCount;
  const events: ScopaEvent[] = [];

  let deck: CardId[] = [];
  let tableCards: CardId[] = [];
  let redeal = true;

  while (redeal) {
    deck = prng.shuffle([...FULL_DECK]);
    tableCards = [];

    // Deal table cards first if applicable
    if (config.initialTableCards > 0) {
      tableCards = deck.splice(0, config.initialTableCards);

      // Check Kings redeal rule
      if (config.redealOnKings) {
        const kings = tableCards.filter((c) => rankOf(c) === 10).length;
        if (kings >= 3) {
          events.push({ type: 'DealVoidedKings', kingsCount: kings });
          continue; // Reshuffle and redeal
        }
      }
    }
    redeal = false;
  }

  // Deal initial cards to each seat
  const hands: CardId[][] = Array.from({ length: numSeats }, () => []);
  for (let s = 0; s < numSeats; s++) {
    hands[s] = deck.splice(0, config.initialHandCards);
  }

  state.deck = deck;
  state.hands = hands;
  state.table = tableCards;
  state.lastCaptureSeat = null;
  state.lastCaptureSide = null;
  state.handScoreResult = null;
  state.phase = 'playing';

  // In standard play, the seat after the dealer starts
  state.activeSeat = (state.dealerSeat + 1) % numSeats;

  events.push({
    type: 'HandDealt',
    handIndex: state.handIndex,
    dealerSeat: state.dealerSeat,
    table: [...state.table],
  });

  return events;
}

/**
 * Applies a command to the state, returning the new state and emitted events.
 */
export function applyScopaCommand(
  currentState: ScopaMatchState,
  command: ScopaCommand
): { state: ScopaMatchState; events: ScopaEvent[] } {
  // Validate sequence number
  if (command.seq !== currentState.commandSeq + 1) {
    throw new Error(
      `Invalid command sequence: expected ${currentState.commandSeq + 1}, got ${command.seq}`
    );
  }

  // Deep clone state for pure immutability
  const state: ScopaMatchState = {
    ...currentState,
    setup: currentState.setup,
    deck: [...currentState.deck],
    hands: currentState.hands.map((h) => [...h]),
    table: [...currentState.table],
    capturedBySide: currentState.capturedBySide.map((c) => [...c]),
    scopeCountBySide: [...currentState.scopeCountBySide],
    cumulativeScores: [...currentState.cumulativeScores],
    commandSeq: command.seq,
  };

  const events: ScopaEvent[] = [];
  const config = state.setup.config;
  const numSeats = config.playerCount;
  const activeSide = sideOfSeat(state.activeSeat, config);

  if (command.type === 'play') {
    if (state.phase !== 'playing') {
      throw new Error(`Cannot play card when phase is ${state.phase}`);
    }
    if (command.seat !== state.activeSeat) {
      throw new Error(`It is not seat ${command.seat}'s turn (active is ${state.activeSeat})`);
    }

    const hand = state.hands[command.seat];
    const cardIdx = hand.indexOf(command.card);
    if (cardIdx === -1) {
      throw new Error(`Card ${command.card} not in seat ${command.seat}'s hand`);
    }

    // Remove card from hand
    hand.splice(cardIdx, 1);
    events.push({ type: 'CardPlayed', seat: command.seat, card: command.card });

    // Evaluate capture options
    const legalOptions = findLegalCaptures(command.card, state.table, config);

    if (legalOptions.length > 0) {
      const chosenOptIndex =
        command.captureOptionIndex !== undefined &&
        command.captureOptionIndex >= 0 &&
        command.captureOptionIndex < legalOptions.length
          ? command.captureOptionIndex
          : 0;

      const chosenOption: CaptureOption = legalOptions[chosenOptIndex];

      // Remove captured cards from table
      for (const capCard of chosenOption.capturedCards) {
        const tIdx = state.table.indexOf(capCard);
        if (tIdx !== -1) {
          state.table.splice(tIdx, 1);
        }
      }

      // Add played card + captured cards to side's capture pile
      state.capturedBySide[activeSide].push(command.card, ...chosenOption.capturedCards);
      state.lastCaptureSeat = command.seat;
      state.lastCaptureSide = activeSide;

      events.push({
        type: 'CardsCaptured',
        seat: command.seat,
        side: activeSide,
        playedCard: command.card,
        capturedCards: chosenOption.capturedCards,
      });

      // Check for Scopa sweep
      const isTableCleared = state.table.length === 0;
      const isFinalPlayOfDeck =
        state.deck.length === 0 && state.hands.every((h) => h.length === 0);

      // By rule: clearing table with the last card of the hand never scores a scopa
      if (isTableCleared && !isFinalPlayOfDeck) {
        state.scopeCountBySide[activeSide]++;
        events.push({
          type: 'ScopaScored',
          seat: command.seat,
          side: activeSide,
          totalScope: state.scopeCountBySide[activeSide],
        });
      }
    } else {
      // Discard / place card onto table
      state.table.push(command.card);
      events.push({ type: 'TableCardPlaced', seat: command.seat, card: command.card });
    }

    // Check if round of hands is exhausted
    const allHandsEmpty = state.hands.every((h) => h.length === 0);

    if (allHandsEmpty) {
      if (state.deck.length > 0) {
        // Deal next 3 cards to each seat
        for (let s = 0; s < numSeats; s++) {
          state.hands[s] = state.deck.splice(0, config.initialHandCards);
        }
        events.push({ type: 'RoundDealt', roundIndex: state.commandSeq });
        state.activeSeat = (state.activeSeat + 1) % numSeats;
      } else {
        // Complete Hand Ended!
        // Remaining table cards go to last capture side
        if (state.table.length > 0 && state.lastCaptureSide !== null) {
          const remaining = [...state.table];
          state.capturedBySide[state.lastCaptureSide].push(...remaining);
          state.table = [];
          events.push({
            type: 'RemainingTableClaimed',
            side: state.lastCaptureSide,
            cards: remaining,
          });
        }

        // Evaluate Hand Scores
        const handScore = evaluateScopaHand(
          state.capturedBySide,
          state.scopeCountBySide,
          config
        );
        state.handScoreResult = handScore;

        for (let i = 0; i < state.cumulativeScores.length; i++) {
          state.cumulativeScores[i] += handScore.points[i];
        }

        events.push({
          type: 'HandEnded',
          handIndex: state.handIndex,
          result: handScore,
          cumulativeScores: [...state.cumulativeScores],
        });

        // Check for match winner
        let highestScore = -1;
        let winningSide = -1;
        let isTie = false;

        for (let i = 0; i < state.cumulativeScores.length; i++) {
          const s = state.cumulativeScores[i];
          if (s >= config.targetScore) {
            if (s > highestScore) {
              highestScore = s;
              winningSide = i;
              isTie = false;
            } else if (s === highestScore) {
              isTie = true;
            }
          }
        }

        if (winningSide >= 0 && !isTie) {
          state.phase = 'match-ended';
          state.winner = winningSide;
          events.push({
            type: 'MatchEnded',
            winner: winningSide,
            cumulativeScores: [...state.cumulativeScores],
          });
        } else {
          state.phase = 'hand-ended';
        }
      }
    } else {
      // Advance to next player
      state.activeSeat = (state.activeSeat + 1) % numSeats;
    }
  } else if (command.type === 'advance-hand') {
    if (state.phase !== 'hand-ended') {
      throw new Error(`Cannot advance hand when phase is ${state.phase}`);
    }

    state.handIndex++;
    state.dealerSeat = (state.dealerSeat + 1) % numSeats;
    state.scopeCountBySide = state.scopeCountBySide.map(() => 0);
    state.capturedBySide = state.capturedBySide.map(() => []);

    // Create PRNG derived from initial seed + handIndex
    const handPRNG = new PRNG(state.setup.seed + state.handIndex * 10007);
    const dealEvents = dealNewHand(state, handPRNG);
    events.push(...dealEvents);
  }

  return { state, events };
}

/**
 * Replays a sequence of commands from setup, verifying deterministic execution.
 */
export function replayScopa(setup: ScopaMatchSetup, commands: ScopaCommand[]): ScopaMatchState {
  let state = createScopaMatch(setup);
  for (const cmd of commands) {
    const res = applyScopaCommand(state, cmd);
    state = res.state;
  }
  return state;
}
