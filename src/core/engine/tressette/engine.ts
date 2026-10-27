import { FULL_DECK, type CardId } from '../../cards/types';
import { PRNG } from '../../rng/prng';
import {
  findTressetteAccusi,
  getLegalTressetteMoves,
  resolveTressetteTrick,
  sortHandForTressette,
  tressetteTerziOf,
  type TressetteAccuso,
  type TressetteSignal,
  type TressetteTrickCard,
} from '../../rules/tressette/types';

export type TressetteVariantId = 'classic-2p' | 'teams-4p' | 'perdere-2p' | 'perdere-4p';
export type TressettePresetId = TressetteVariantId;

export interface TressettePresetInfo {
  id: TressetteVariantId;
  nameIt: string;
  nameEn: string;
  descIt: string;
  descEn: string;
  playerCount: 2 | 4;
  partnerships: boolean;
  isPerdere: boolean;
  targetPoints: number;
}

export const TRESSETTE_PRESETS: Record<TressetteVariantId, TressettePresetInfo> = {
  'classic-2p': {
    id: 'classic-2p',
    nameIt: 'Tressette in Due (Pizzico — 1 vs 1)',
    nameEn: 'Two-Player Tressette (1 vs 1)',
    descIt:
      '10 carte a testa e 20 nel tallone. Dopo ogni presa si pesca mostrando la carta pescata. Obbligo di rispondere a seme!',
    descEn:
      '10 cards each and 20 in the stock. After each trick both players draw and reveal the drawn card. Must follow suit!',
    playerCount: 2,
    partnerships: false,
    isPerdere: false,
    targetPoints: 21,
  },
  'teams-4p': {
    id: 'teams-4p',
    nameIt: 'Tressette in Quattro (Coppie — 2 vs 2)',
    nameEn: 'Partnership Tressette (2 vs 2)',
    descIt:
      '4 giocatori in 2 squadre (10 carte a testa, nessun tallone). Include i segnali tradizionali al compagno: Busso, Striscio e Volo!',
    descEn:
      '4 players in 2 teams (10 cards each, no draw pile). Features traditional partner signals: Busso, Striscio, and Volo!',
    playerCount: 4,
    partnerships: true,
    isPerdere: false,
    targetPoints: 21,
  },
  'perdere-2p': {
    id: 'perdere-2p',
    nameIt: 'Traversone / Rovescino (A Perdere — 1 vs 1)',
    nameEn: 'Traversone / Rovescino (Avoid Points — 1 vs 1)',
    descIt:
      "Vince chi fa MENO punti! L'Asso di Bastoni vale 11 punti (totale smazzata 21 pt). Chi supera il limite perde!",
    descEn:
      'Lowest score wins! The Ace of Clubs is worth 11 points (hand total 21 pts). Exceeding the target loses!',
    playerCount: 2,
    partnerships: false,
    isPerdere: true,
    targetPoints: 21,
  },
  'perdere-4p': {
    id: 'perdere-4p',
    nameIt: 'Traversone in Quattro (A Perdere — 4 Giocatori)',
    nameEn: 'Four-Player Traversone (Avoid Points)',
    descIt:
      "4 giocatori con 10 carte a testa: l'obiettivo è evitare le prese e l'Asso di Bastoni (+11 pt). Cappotto (21 pt) fa vincere!",
    descEn:
      '4 players with 10 cards each: avoid tricks and the Ace of Clubs (+11 pts). Scoring a Cappotto (all 21 pts) wins!',
    playerCount: 4,
    partnerships: false,
    isPerdere: true,
    targetPoints: 21,
  },
};

export interface TressetteSeatConfig {
  kind: 'human' | 'ai';
  name: string;
  avatar: string;
  aiDifficulty?: 'relaxed' | 'standard' | 'expert';
}

export interface TressetteMatchSetup {
  seats: TressetteSeatConfig[];
  seed: number;
  variant?: TressetteVariantId;
  presetId?: TressetteVariantId;
  targetPoints?: number;
  enableAccusi?: boolean;
}

export interface DrawnCardReveal {
  seat: number;
  card: CardId;
}

export interface TressetteHandSummary {
  handNumber: number;
  terziBySide: number[];
  cardPointsBySide: number[];
  ultimaSide: number;
  accusiPointsBySide: number[];
  totalHandPointsBySide: number[];
  cumulativeScores: number[];
}

export interface TressetteMatchState {
  setup: TressetteMatchSetup;
  variant: TressetteVariantId;
  isPerdere: boolean;
  partnerships: boolean;
  enableAccusi: boolean;
  targetPoints: number;
  handNumber: number;
  trickNumber: number;
  phase: 'playing' | 'trick-ended' | 'hand-ended' | 'match-ended';
  dealerSeat: number;
  activeSeat: number;
  deck: CardId[];
  hands: CardId[][];
  currentTrick: TressetteTrickCard[];
  lastCompletedTrick: TressetteTrickCard[];
  lastTrickWinnerSeat: number | null;
  lastTrickTerzi: number;
  lastDrawnCards: DrawnCardReveal[];
  capturedBySide: CardId[][];
  tricksWonBySide: number[];
  terziBySide: number[];
  accusiBySeat: Record<number, TressetteAccuso[]>;
  accusiPointsBySide: number[];
  cumulativeScores: number[];
  lastHandSummary: TressetteHandSummary | null;
  trickWinnerSeat: number | null;
  winnerSide: number | null;
  commandSeq: number;
}

export type TressetteCommand =
  | { type: 'play'; seat: number; card: CardId; signal?: TressetteSignal; seq: number }
  | { type: 'advance-trick'; seq: number }
  | { type: 'next-hand'; seq: number };

export function sideOfSeat(state: TressetteMatchState, seat: number): number {
  if (state.partnerships && state.setup.seats.length === 4) {
    return seat % 2;
  }
  return seat;
}

function dealTressetteHand(state: TressetteMatchState, seedOffset: number) {
  const prng = new PRNG(state.setup.seed + seedOffset * 7919);
  const deck = prng.shuffle([...FULL_DECK]);
  const numSeats = state.setup.seats.length;
  const numSides = state.partnerships && numSeats === 4 ? 2 : numSeats;

  // In both 2P and 4P Tressette, each player receives 10 cards!
  // In 2P, 20 cards remain in the Tallone (deck). In 4P, all 40 cards are dealt (deck is empty).
  const hands: CardId[][] = Array.from({ length: numSeats }, () => []);
  for (let s = 0; s < numSeats; s++) {
    hands[s] = sortHandForTressette(deck.splice(0, 10));
  }

  state.deck = deck;
  state.hands = hands;
  state.trickNumber = 1;
  state.phase = 'playing';
  state.activeSeat = (state.dealerSeat + 1) % numSeats;
  state.currentTrick = [];
  state.lastCompletedTrick = [];
  state.lastTrickWinnerSeat = null;
  state.lastTrickTerzi = 0;
  state.lastDrawnCards = [];
  state.trickWinnerSeat = null;
  state.capturedBySide = Array.from({ length: numSides }, () => []);
  state.tricksWonBySide = Array.from({ length: numSides }, () => 0);
  state.terziBySide = Array.from({ length: numSides }, () => 0);
  state.accusiBySeat = {};
  state.accusiPointsBySide = Array.from({ length: numSides }, () => 0);

  // Detect Accusi at start of hand (if enabled and not A Perdere)
  if (state.enableAccusi && !state.isPerdere) {
    for (let s = 0; s < numSeats; s++) {
      const found = findTressetteAccusi(state.hands[s]);
      if (found.length > 0) {
        state.accusiBySeat[s] = found;
        const side = sideOfSeat(state, s);
        const pts = found.reduce((acc, a) => acc + a.points, 0);
        state.accusiPointsBySide[side] += pts;
      }
    }
  }
}

export function createTressetteMatch(setup: TressetteMatchSetup): TressetteMatchState {
  const numSeats = setup.seats.length;
  const variant =
    setup.variant ?? setup.presetId ?? (numSeats === 4 ? 'teams-4p' : 'classic-2p');
  const preset = TRESSETTE_PRESETS[variant] ?? TRESSETTE_PRESETS['classic-2p'];
  const partnerships = preset.partnerships && numSeats === 4;
  const numSides = partnerships ? 2 : numSeats;

  const state: TressetteMatchState = {
    setup,
    variant,
    isPerdere: preset.isPerdere,
    partnerships,
    enableAccusi: setup.enableAccusi ?? !preset.isPerdere,
    targetPoints: setup.targetPoints ?? preset.targetPoints,
    handNumber: 1,
    trickNumber: 1,
    phase: 'playing',
    dealerSeat: numSeats - 1,
    activeSeat: 0,
    deck: [],
    hands: [],
    currentTrick: [],
    lastCompletedTrick: [],
    lastTrickWinnerSeat: null,
    lastTrickTerzi: 0,
    lastDrawnCards: [],
    capturedBySide: Array.from({ length: numSides }, () => []),
    tricksWonBySide: Array.from({ length: numSides }, () => 0),
    terziBySide: Array.from({ length: numSides }, () => 0),
    accusiBySeat: {},
    accusiPointsBySide: Array.from({ length: numSides }, () => 0),
    cumulativeScores: Array.from({ length: numSides }, () => 0),
    lastHandSummary: null,
    trickWinnerSeat: null,
    winnerSide: null,
    commandSeq: 0,
  };

  dealTressetteHand(state, 1);
  return state;
}

function finalizeTrick(state: TressetteMatchState, events: any[]) {
  const numSeats = state.setup.seats.length;
  const winPlay = resolveTressetteTrick(state.currentTrick);
  const winningSeat = winPlay.seat;
  const winningSide = sideOfSeat(state, winningSeat);

  state.trickWinnerSeat = winningSeat;
  state.lastTrickWinnerSeat = winningSeat;
  state.lastCompletedTrick = [...state.currentTrick];

  const trickCards = state.currentTrick.map((p) => p.card);
  const trickTerzi = trickCards.reduce(
    (sum, c) => sum + tressetteTerziOf(c, state.isPerdere),
    0
  );
  state.lastTrickTerzi = trickTerzi;

  state.capturedBySide[winningSide].push(...trickCards);
  state.tricksWonBySide[winningSide] += 1;
  state.terziBySide[winningSide] += trickTerzi;

  // In 2P Tressette (with Tallone), each player draws 1 card after the trick (winner first, loser second)
  // Both drawn cards are briefly revealed face-up per official Tressette in Due rules!
  state.lastDrawnCards = [];
  if (state.deck.length > 0) {
    for (let i = 0; i < numSeats; i++) {
      const seat = (winningSeat + i) % numSeats;
      if (state.deck.length > 0) {
        const drawn = state.deck.pop()!;
        state.hands[seat].push(drawn);
        state.hands[seat] = sortHandForTressette(state.hands[seat]);
        state.lastDrawnCards.push({ seat, card: drawn });
      }
    }
  }

  state.currentTrick = [];

  const allEmpty = state.hands.every((h) => h.length === 0);
  if (!allEmpty) {
    state.phase = 'playing';
    state.trickNumber += 1;
    state.activeSeat = winningSeat;
    events.push({
      type: 'TressetteTrickWon',
      winnerSeat: winningSeat,
      side: winningSide,
      terzi: trickTerzi,
      drawn: [...state.lastDrawnCards],
    });
    return;
  }

  // Hand has ended! Compute hand points:
  // - Whole card points = Math.floor(terzi / 3)
  // - Ultima (last trick winner) = +1 point (or +3 terzi before floor; since 3 terzi = 1 whole point, adding +1 point is identical!)
  const numSides = state.cumulativeScores.length;
  const cardPointsBySide = state.terziBySide.map((t) => Math.floor(t / 3));
  const totalHandPointsBySide = cardPointsBySide.map((pts, side) => {
    const ultimaBonus = side === winningSide ? 1 : 0;
    const accusiBonus = state.accusiPointsBySide[side] ?? 0;
    return pts + ultimaBonus + accusiBonus;
  });

  // Check for Cappotto in "A Perdere" mode (if one side takes all 21 points, or all 10 tricks, their opponents get +21 instead!)
  if (state.isPerdere) {
    const maxPts = Math.max(...totalHandPointsBySide);
    if (maxPts >= 21) {
      const cappottoSide = totalHandPointsBySide.indexOf(maxPts);
      for (let s = 0; s < numSides; s++) {
        state.cumulativeScores[s] += s === cappottoSide ? 0 : 21;
      }
    } else {
      for (let s = 0; s < numSides; s++) {
        state.cumulativeScores[s] += totalHandPointsBySide[s];
      }
    }
  } else {
    for (let s = 0; s < numSides; s++) {
      state.cumulativeScores[s] += totalHandPointsBySide[s];
    }
  }

  state.lastHandSummary = {
    handNumber: state.handNumber,
    terziBySide: [...state.terziBySide],
    cardPointsBySide,
    ultimaSide: winningSide,
    accusiPointsBySide: [...state.accusiPointsBySide],
    totalHandPointsBySide,
    cumulativeScores: [...state.cumulativeScores],
  };

  // Check if match target reached
  const someoneReachedTarget = state.cumulativeScores.some(
    (sc) => sc >= state.targetPoints
  );

  if (someoneReachedTarget) {
    if (state.isPerdere) {
      // In A Perdere, lowest score wins!
      const minScore = Math.min(...state.cumulativeScores);
      const winners = state.cumulativeScores
        .map((sc, idx) => (sc === minScore ? idx : -1))
        .filter((idx) => idx !== -1);
      if (winners.length === 1) {
        state.phase = 'match-ended';
        state.winnerSide = winners[0];
      } else {
        // Tie for lowest score -> play another hand
        state.phase = 'hand-ended';
      }
    } else {
      // Normal Tressette: highest score wins (if strictly ahead)
      const maxScore = Math.max(...state.cumulativeScores);
      const winners = state.cumulativeScores
        .map((sc, idx) => (sc === maxScore ? idx : -1))
        .filter((idx) => idx !== -1);
      if (winners.length === 1) {
        state.phase = 'match-ended';
        state.winnerSide = winners[0];
      } else {
        state.phase = 'hand-ended';
      }
    }
  } else {
    state.phase = 'hand-ended';
  }

  events.push({
    type: 'TressetteHandEnded',
    summary: state.lastHandSummary,
    matchEnded: state.phase === 'match-ended',
    winnerSide: state.winnerSide,
  });
}

export function dispatchTressetteCommand(
  prevState: TressetteMatchState,
  cmd: TressetteCommand
): { state: TressetteMatchState; events: any[] } {
  const state: TressetteMatchState = {
    ...prevState,
    deck: [...prevState.deck],
    hands: prevState.hands.map((h) => [...h]),
    currentTrick: prevState.currentTrick.map((t) => ({ ...t })),
    lastCompletedTrick: prevState.lastCompletedTrick.map((t) => ({ ...t })),
    lastDrawnCards: prevState.lastDrawnCards.map((d) => ({ ...d })),
    capturedBySide: prevState.capturedBySide.map((c) => [...c]),
    tricksWonBySide: [...prevState.tricksWonBySide],
    terziBySide: [...prevState.terziBySide],
    accusiPointsBySide: [...prevState.accusiPointsBySide],
    cumulativeScores: [...prevState.cumulativeScores],
  };

  const events: any[] = [];

  if (cmd.type === 'play') {
    if (state.phase !== 'playing') return { state, events };
    if (cmd.seat !== state.activeSeat) return { state, events };

    const hand = state.hands[cmd.seat];
    const idx = hand.indexOf(cmd.card);
    if (idx === -1) return { state, events };

    // Verify suit-following rule!
    const legal = getLegalTressetteMoves(hand, state.currentTrick);
    if (!legal.includes(cmd.card)) {
      return { state, events };
    }

    hand.splice(idx, 1);
    const signal: TressetteSignal =
      state.currentTrick.length === 0 ? (cmd.signal ?? null) : null;
    state.currentTrick.push({
      seat: cmd.seat,
      card: cmd.card,
      signal,
    });
    state.commandSeq += 1;

    events.push({
      type: 'TressetteCardPlayed',
      seat: cmd.seat,
      card: cmd.card,
      signal,
    });

    const numSeats = state.setup.seats.length;
    if (state.currentTrick.length < numSeats) {
      state.activeSeat = (state.activeSeat + 1) % numSeats;
    } else {
      // Hold trick on table for visual inspection & choreography
      const winPlay = resolveTressetteTrick(state.currentTrick);
      state.phase = 'trick-ended';
      state.trickWinnerSeat = winPlay.seat;
      events.push({
        type: 'TressetteTrickReady',
        winnerSeat: winPlay.seat,
      });
    }
    return { state, events };
  }

  if (cmd.type === 'advance-trick') {
    if (state.phase !== 'trick-ended') return { state, events };
    state.commandSeq += 1;
    finalizeTrick(state, events);
    return { state, events };
  }

  if (cmd.type === 'next-hand') {
    if (state.phase !== 'hand-ended') return { state, events };
    state.commandSeq += 1;
    state.handNumber += 1;
    state.dealerSeat = (state.dealerSeat + 1) % state.setup.seats.length;
    dealTressetteHand(state, state.handNumber);
    events.push({
      type: 'TressetteNextHandStarted',
      handNumber: state.handNumber,
    });
    return { state, events };
  }

  return { state, events };
}
