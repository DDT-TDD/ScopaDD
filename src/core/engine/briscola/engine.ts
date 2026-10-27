import { FULL_DECK, suitOf, type CardId, type Suit } from '../../cards/types';
import { PRNG } from '../../rng/prng';
import {
  briscolaPointsOf,
  resolveBriscolaTrick,
  type BriscolaTrickCard,
} from '../../rules/briscola/types';

export type BriscolaVariantId = 'classic-2p' | 'teams-4p' | 'scoperta-2p' | 'fast-31';
export type BriscolaPresetId = BriscolaVariantId;

export interface BriscolaPresetInfo {
  id: BriscolaVariantId;
  nameIt: string;
  nameEn: string;
  descIt: string;
  descEn: string;
  playerCount: 2 | 4;
  partnerships: boolean;
  openHands: boolean;
  targetPoints: number;
}

export const BRISCOLA_PRESETS: Record<BriscolaVariantId, BriscolaPresetInfo> = {
  'classic-2p': {
    id: 'classic-2p',
    nameIt: 'Briscola Classica (1 vs 1)',
    nameEn: 'Classic Briscola (1 vs 1)',
    descIt: 'Sfida tradizionale a 2 giocatori, vince chi supera i 60 punti su 120.',
    descEn: 'Traditional 2-player duel, win by scoring 61+ out of 120 points.',
    playerCount: 2,
    partnerships: false,
    openHands: false,
    targetPoints: 61,
  },
  'teams-4p': {
    id: 'teams-4p',
    nameIt: 'Briscola in Quattro (2 vs 2)',
    nameEn: 'Partnership Briscola (2 vs 2)',
    descIt: '4 giocatori in 2 squadre (Tu + Compagno contro 2 Avversari).',
    descEn: '4 players in 2 teams (You + Partner vs 2 Opponents).',
    playerCount: 4,
    partnerships: true,
    openHands: false,
    targetPoints: 61,
  },
  'scoperta-2p': {
    id: 'scoperta-2p',
    nameIt: 'Briscola Scoperta (Ideale per Bimbi)',
    nameEn: 'Open-Hand Briscola (Kids & Learning)',
    descIt: 'Tutte le carte in mano sono visibili per imparare facilmente la strategia.',
    descEn: 'All hand cards are face-up to help children and beginners learn strategy.',
    playerCount: 2,
    partnerships: false,
    openHands: true,
    targetPoints: 61,
  },
  'fast-31': {
    id: 'fast-31',
    nameIt: 'Briscola a 31 (Partita Rapida)',
    nameEn: 'Briscola to 31 (Quick Match)',
    descIt: 'Vince immediatamente il primo giocatore che raggiunge 31 punti!',
    descEn: 'First player to capture 31 points wins the hand immediately!',
    playerCount: 2,
    partnerships: false,
    openHands: false,
    targetPoints: 31,
  },
};

export interface BriscolaSeatConfig {
  kind: 'human' | 'ai';
  name: string;
  avatar: string;
  aiDifficulty?: 'relaxed' | 'standard' | 'expert';
}

export interface BriscolaMatchSetup {
  seats: BriscolaSeatConfig[];
  seed: number;
  variant?: BriscolaVariantId;
  presetId?: BriscolaVariantId;
  playerCount?: 2 | 4;
  partnerships?: boolean;
  openHands?: boolean;
  targetPoints?: number;
  targetWins?: number;
  immediateSweep?: boolean;
}

export interface BriscolaMatchState {
  setup: BriscolaMatchSetup;
  variant: BriscolaVariantId;
  openHands: boolean;
  targetPoints: number;
  phase: 'playing' | 'trick-ended' | 'hand-ended' | 'match-ended';
  dealerSeat: number;
  activeSeat: number;
  trumpCard: CardId;
  trumpSuit: Suit;
  trumpTaken: boolean;
  deck: CardId[];
  hands: CardId[][];
  currentTrick: BriscolaTrickCard[];
  lastTrickWinnerSeat: number | null;
  lastTrickPoints: number;
  capturedBySide: CardId[][];
  pointsBySide: number[];
  points: number[];
  trickWinnerSeat: number | null;
  winner: number | null;
  winnerSide: number | null;
  commandSeq: number;
}

export type BriscolaCommand =
  | { type: 'play'; seat: number; card: CardId; seq: number }
  | { type: 'advance-trick'; seq: number };

export function createBriscolaMatch(setup: BriscolaMatchSetup): BriscolaMatchState {
  const prng = new PRNG(setup.seed);
  const deck = prng.shuffle([...FULL_DECK]);
  const numSeats = setup.seats.length;
  const numSides = numSeats === 4 ? 2 : numSeats;
  const variant = setup.variant ?? setup.presetId ?? (numSeats === 4 ? 'teams-4p' : 'classic-2p');
  const preset = BRISCOLA_PRESETS[variant] ?? BRISCOLA_PRESETS['classic-2p'];

  // Deal 3 cards to each player
  const hands: CardId[][] = Array.from({ length: numSeats }, () => []);
  for (let s = 0; s < numSeats; s++) {
    hands[s] = deck.splice(0, 3);
  }

  // 1 card is turned face-up as the Briscola Trump card
  const trumpCard = deck.pop()!;
  const trumpSuit = suitOf(trumpCard);
  const initialPoints = Array.from({ length: numSides }, () => 0);

  return {
    setup,
    variant,
    openHands: setup.openHands ?? preset.openHands,
    targetPoints: setup.targetPoints ?? preset.targetPoints,
    phase: 'playing',
    dealerSeat: numSeats - 1,
    activeSeat: 0,
    trumpCard,
    trumpSuit,
    trumpTaken: false,
    deck,
    hands,
    currentTrick: [],
    lastTrickWinnerSeat: null,
    lastTrickPoints: 0,
    capturedBySide: Array.from({ length: numSides }, () => []),
    pointsBySide: initialPoints,
    points: initialPoints,
    trickWinnerSeat: null,
    winner: null,
    winnerSide: null,
    commandSeq: 0,
  };
}

function finalizeTrick(state: BriscolaMatchState, events: any[]) {
  const numSeats = state.setup.seats.length;
  const winPlay = resolveBriscolaTrick(state.currentTrick, state.trumpSuit);
  const winningSeat = winPlay.seat;
  const winningSide = numSeats === 4 ? winningSeat % 2 : winningSeat;

  state.trickWinnerSeat = winningSeat;
  state.lastTrickWinnerSeat = winningSeat;

  // Calculate trick points
  const trickCards = state.currentTrick.map((p) => p.card);
  const trickPts = trickCards.reduce((sum, c) => sum + briscolaPointsOf(c), 0);
  state.lastTrickPoints = trickPts;

  state.capturedBySide[winningSide].push(...trickCards);
  state.pointsBySide[winningSide] += trickPts;
  state.points = state.pointsBySide;

  events.push({
    type: 'TrickWon',
    seat: winningSeat,
    winnerSeat: winningSeat,
    side: winningSide,
    points: trickPts,
    cards: trickCards,
  });

  // Check if Briscola a 31 immediate win threshold is reached
  if (state.variant === 'fast-31' && state.pointsBySide[winningSide] >= state.targetPoints) {
    state.currentTrick = [];
    state.phase = 'match-ended';
    state.winner = winningSide;
    state.winnerSide = winningSide;
    events.push({
      type: 'BriscolaMatchEnded',
      winner: state.winner,
      points: [...state.pointsBySide],
    });
    return;
  }

  // Drawing cards after trick while cards remain
  if (!state.trumpTaken) {
    for (let i = 0; i < numSeats; i++) {
      const seat = (winningSeat + i) % numSeats;
      if (state.deck.length > 0) {
        state.hands[seat].push(state.deck.pop()!);
      } else if (!state.trumpTaken) {
        state.hands[seat].push(state.trumpCard);
        state.trumpTaken = true;
      }
    }
  }

  state.currentTrick = [];

  // Check if match is finished (all cards played)
  const allEmpty = state.hands.every((h) => h.length === 0);
  if (allEmpty) {
    state.phase = 'match-ended';
    const numSides = state.pointsBySide.length;
    let maxPts = -1;
    let winSide = -1;
    let isTie = false;

    for (let s = 0; s < numSides; s++) {
      const pts = state.pointsBySide[s];
      if (pts > maxPts) {
        maxPts = pts;
        winSide = s;
        isTie = false;
      } else if (pts === maxPts) {
        isTie = true;
      }
    }

    state.winner = isTie ? -1 : winSide;
    state.winnerSide = state.winner;
    events.push({
      type: 'BriscolaMatchEnded',
      winner: state.winner,
      points: [...state.pointsBySide],
    });
  } else {
    state.phase = 'playing';
    state.activeSeat = winningSeat;
  }
}

export function applyBriscolaCommand(
  currentState: BriscolaMatchState,
  command: BriscolaCommand,
  immediateSweepOverride?: boolean
): { state: BriscolaMatchState; events: any[] } {
  if (command.seq !== currentState.commandSeq + 1) {
    throw new Error(`Invalid command sequence: expected ${currentState.commandSeq + 1}, got ${command.seq}`);
  }

  const ptsCopy = [...currentState.pointsBySide];
  const state: BriscolaMatchState = {
    ...currentState,
    setup: currentState.setup,
    deck: [...currentState.deck],
    hands: currentState.hands.map((h) => [...h]),
    currentTrick: [...currentState.currentTrick],
    capturedBySide: currentState.capturedBySide.map((c) => [...c]),
    pointsBySide: ptsCopy,
    points: ptsCopy,
    commandSeq: command.seq,
  };

  const numSeats = state.setup.seats.length;
  const events: any[] = [];

  if (command.type === 'play') {
    if (state.phase !== 'playing') {
      throw new Error(`Cannot play when phase is ${state.phase}`);
    }
    if (command.seat !== state.activeSeat) {
      throw new Error(`It is not seat ${command.seat}'s turn`);
    }

    const hand = state.hands[command.seat];
    const idx = hand.indexOf(command.card);
    if (idx === -1) {
      throw new Error(`Card ${command.card} not in seat ${command.seat}'s hand`);
    }

    hand.splice(idx, 1);
    state.currentTrick.push({ seat: command.seat, card: command.card });
    events.push({ type: 'CardPlayed', seat: command.seat, card: command.card });

    // Is trick complete?
    if (state.currentTrick.length === numSeats) {
      const winPlay = resolveBriscolaTrick(state.currentTrick, state.trumpSuit);
      state.trickWinnerSeat = winPlay.seat;

      const doImmediate =
        immediateSweepOverride !== undefined
          ? immediateSweepOverride
          : state.setup.immediateSweep !== false;

      if (doImmediate) {
        finalizeTrick(state, events);
      } else {
        state.phase = 'trick-ended';
      }
    } else {
      state.activeSeat = (state.activeSeat + 1) % numSeats;
    }
  } else if (command.type === 'advance-trick') {
    if (state.phase === 'trick-ended') {
      finalizeTrick(state, events);
    }
  }

  return { state, events };
}
