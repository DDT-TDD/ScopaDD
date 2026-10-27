import type { ScopaPresetId } from '../core/rules/scopa/config';
import type { BriscolaVariantId } from '../core/engine/briscola/engine';
import type { DeckStyle } from '../presentation/deckStyles/vectorDecks';
import type { TableAtmosphere } from '../presentation/table3d/table3d';

export type Language = 'it' | 'en';

let currentLang: Language =
  (typeof localStorage !== 'undefined' &&
    (localStorage.getItem('scopa_lang') as Language)) ||
  'it';

export function getLang(): Language {
  return currentLang;
}

export function getLanguage(): Language {
  return currentLang;
}

export function setLang(lang: Language) {
  currentLang = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('scopa_lang', lang);
  }
}

export interface Translations {
  gameTitle: string;
  scopa: string;
  scopaMode: string;
  briscola: string;
  briscolaMode: string;
  tressette: string;
  tressetteMode: string;
  solitario: string;
  close: string;
  newGame: string;
  multiplayer: string;
  multiplayerBtn: string;
  simpleModeOn: string;
  simpleModeOff: string;
  simpleModeDesc: string;
  credits: string;
  settings: string;
  yourTurn: string;
  turnOf: string;
  opponentThinking: string;
  waitingOpponent: string;
  playerTurn: (name: string) => string;
  youPlayer: string;
  partnerPlayer: string;
  partnerLabel: string;
  opponentPlayer: string;
  computer: string;
  computerN: (n: number) => string;
  team1: string;
  team2: string;
  target: string;
  emptyTable: string;
  possibleCapture: string;
  chooseCombination: string;
  chooseOption: string;
  optionBtn: (n: number) => string;
  playThisCard: string;
  selectCardPrompt: string;
  cancel: string;
  optionN: (n: number) => string;
  scopaToast: (name: string) => string;
  trickPointsToast: (name: string, pts: number) => string;
  handOver: string;
  handEndedTitle: string;
  matchEndedTitle: string;
  handLabel: (n: number) => string;
  winnerTitle: (name: string) => string;
  rematch: string;
  matchWonBy: (name: string) => string;
  matchTied: string;
  nextHand: string;
  playAgain: string;
  backToGame: string;
  backToScopa: string;
  restart: string;
  moves: string;
  passes: string;
  congratulations: string;
  solitaireWon: string;
  deckMenu: string;
  themeMenu: string;
  tableMenu: string;
  passDeviceTitle: (name: string) => string;
  passDeviceDesc: string;
  imReadyBtn: (name: string) => string;
  deckStyles: Record<DeckStyle, string>;
  themes: Record<TableAtmosphere, string>;
  briscolaPresets: Record<BriscolaVariantId, { name: string; desc: string }>;
  briscolaUI: {
    trumpLabel: string;
    cardsInDeck: (n: number) => string;
    deckEmpty: string;
    pointsLabel: string;
    trickWonBy: (name: string, pts: number) => string;
    openHandBadge: string;
    trumpStarBadge: string;
    matchEndedTitle: string;
    yourPoints: string;
    opponentPoints: string;
  };
  mp: {
    title: string;
    subtitle: string;
    passAndPlayTitle: string;
    passAndPlayDesc: string;
    startPassAndPlay: string;
    lanTitle: string;
    lanDesc: string;
    roomWordLabel: string;
    joinRoomBtn: string;
    lanActiveStatus: string;
    remoteTitle: string;
    remoteDesc: string;
    copyInviteBtn: string;
    pastePlaceholder: string;
    connectInviteBtn: string;
    copiedSuccess: string;
  };
  multiplayerUI: {
    title: string;
    subtitle: string;
    passAndPlayTitle: string;
    passAndPlayDesc: string;
    passAndPlayStart: string;
    lanTitle: string;
    lanDesc: string;
    lanCreateBtn: string;
    lanJoinBtn: string;
    lanRoomLabel: string;
    lanScanQr: string;
    lanEnterCodePlaceholder: string;
    lanConnectBtn: string;
    onlineTitle: string;
    onlineDesc: string;
    onlineCreateInviteBtn: string;
    onlineJoinInviteBtn: string;
    onlineCopyCodeBtn: string;
    onlineCopiedMsg: string;
    onlinePastePrompt: string;
    privacyTitle: (name: string) => string;
    privacySubtitle: string;
    privacyReadyBtn: string;
    connectedBadge: (mode: string) => string;
  };
  categories: {
    scope: string;
    carte: string;
    denari: string;
    setteBello: string;
    primiera: string;
    napola: string;
    reBello: string;
    totalHand: string;
    totalMatch: string;
  };
  wizard: {
    title: string;
    selectGame: string;
    selectGameType: string;
    selectVariant: string;
    selectBriscolaVariant: string;
    selectPlayMode: string;
    playMode: string;
    vsComputer: string;
    passAndPlay: string;
    modeSolo: string;
    modePassAndPlay: string;
    modeLan: string;
    selectDeck: string;
    aiDifficulty: string;
    relaxed: string;
    standard: string;
    expert: string;
    atmosphere: string;
    trattoria: string;
    salotto: string;
    piazza: string;
    notte: string;
    halloween: string;
    xmas: string;
    bimbi: string;
    startGame: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  it: {
    gameTitle: 'Scopa, Briscola, Tressette & Solitario',
    scopa: 'Scopa',
    scopaMode: 'Scopa',
    briscola: 'Briscola',
    briscolaMode: 'Briscola',
    tressette: 'Tressette',
    tressetteMode: 'Tressette',
    solitario: 'Solitario',
    close: 'Chiudi',
    newGame: 'Nuova Partita',
    multiplayer: 'Gioca Insieme',
    multiplayerBtn: 'Gioca Insieme',
    simpleModeOn: '💡 Aiuto: ON',
    simpleModeOff: '💡 Aiuto: OFF',
    simpleModeDesc: 'Evidenzia le prese possibili e mostra i punti delle carte per bambini e principianti',
    credits: 'Crediti e Licenze',
    settings: 'Opzioni Partita',
    yourTurn: 'Tocca a te — Scegli una carta dalla tua mano',
    turnOf: 'Turno',
    opponentThinking: 'Il computer sta pensando...',
    waitingOpponent: "In attesa del turno dell'avversario...",
    playerTurn: (name: string) => `Tocca a ${name}`,
    youPlayer: 'Tu',
    partnerPlayer: 'Compagno',
    partnerLabel: 'Compagno',
    opponentPlayer: 'Avversario',
    computer: 'Computer',
    computerN: (n: number) => `Computer ${n}`,
    team1: 'Squadra 1 (Tu)',
    team2: 'Squadra 2',
    target: 'Obiettivo',
    emptyTable: 'Tavolo vuoto — Gioca una carta',
    possibleCapture: 'Presa possibile:',
    chooseCombination: 'Scegli quali carte prendere dal tavolo:',
    chooseOption: 'Più prese possibili — Scegli quale fare:',
    optionBtn: (n: number) => `Prendi Opzione ${n}`,
    playThisCard: '🃏 Gioca questa Carta',
    selectCardPrompt: 'Tocca una carta per vedere le prese o clicca due volte per giocarla',
    cancel: 'Annulla',
    optionN: (n: number) => `Scelta ${n}`,
    scopaToast: (name: string) => `🧹 SCOPA di ${name}! (+1 Punto)`,
    trickPointsToast: (name: string, pts: number) => `👑 Presa di ${name}: +${pts} punti!`,
    handOver: 'Fine della Mano — Riepilogo Punti',
    handEndedTitle: 'Fine della Mano — Riepilogo Punti',
    matchEndedTitle: '🏆 Partita Conclusa!',
    handLabel: (n: number) => `Mano #${n}`,
    winnerTitle: (name: string) => `🏆 Vittoria di ${name}!`,
    rematch: '🔄 Gioca Ancora',
    matchWonBy: (name: string) => `🏆 Partita vinta da ${name}!`,
    matchTied: '🤝 Partita finita in pareggio (60 a 60)!',
    nextHand: 'Prossima Mano ➡️',
    playAgain: 'Gioca Ancora 🔄',
    backToGame: '⬅️ Torna al Gioco',
    backToScopa: '⬅️ Torna a Scopa / Briscola',
    restart: '🔄 Ricomincia',
    moves: 'Mosse',
    passes: 'Giri di mazzo',
    congratulations: 'COMPLIMENTI!',
    solitaireWon: 'HAI COMPLETATO IL SOLITARIO! TUTTE LE 40 CARTE SONO IN ORDINE!',
    deckMenu: 'Mazzo',
    themeMenu: 'Tavolo',
    tableMenu: 'Tavolo',
    passDeviceTitle: (name: string) => `Tocca a ${name}!`,
    passDeviceDesc: 'Passa il computer o tablet al prossimo giocatore. Le carte sono coperte per privacy!',
    imReadyBtn: (name: string) => `👁️ Sono ${name} — Mostra le mie carte`,
    deckStyles: {
      napoletane: 'Napoletane (Classiche)',
      piacentine: 'Piacentine (Tradizionali)',
      bresciane: 'Bresciane (Dal Negro)',
      romagnole: 'Romagnole (Classiche)',
      trevisane: 'Trevisane (Venete)',
      bergamasche: 'Bergamasche (Lombarde)',
      triestine: 'Triestine (Veneto-Giuliane)',
      moderne: 'Fiaba Moderna (Illustrate Bimbi)',
    },
    themes: {
      salotto: '🟩 Panno Verde Classico',
      trattoria: '🪵 Legno di Trattoria',
      piazza: '🏛️ Marmo Veneziano',
      notte: '🌌 Notte Stellata',
      halloween: '🎃 Halloween Stregato',
      xmas: '🎄 Festa di Natale',
      bimbi: '🌈 Regno dei Bimbi',
    },
    briscolaPresets: {
      'classic-2p': {
        name: 'Briscola Classica (1 vs 1)',
        desc: 'Sfida tradizionale a 2 giocatori (61+ punti su 120)',
      },
      'teams-4p': {
        name: 'Briscola in Quattro (2 vs 2)',
        desc: '4 giocatori a coppie (Tu + Compagno contro 2 Avversari)',
      },
      'scoperta-2p': {
        name: 'Briscola Scoperta (Per Bimbi)',
        desc: 'Carte avversarie visibili per imparare facilmente la strategia',
      },
      'fast-31': {
        name: 'Briscola Rapida a 31 Punti',
        desc: 'Partita veloce: vince subito chi raggiunge 31 punti!',
      },
    },
    briscolaUI: {
      trumpLabel: 'Briscola',
      cardsInDeck: (n: number) => `${n} nel mazzo`,
      deckEmpty: 'Mazzo esaurito',
      pointsLabel: 'Punti',
      trickWonBy: (name: string, pts: number) =>
        pts > 0 ? `Presa di ${name} (+${pts} punti)` : `Presa di ${name} (0 punti)`,
      openHandBadge: '👁️ Carte Scoperte',
      trumpStarBadge: '★ Briscola',
      matchEndedTitle: 'Fine della Partita di Briscola',
      yourPoints: 'I Tuoi Punti (o Squadra)',
      opponentPoints: 'Punti Avversario',
    },
    mp: {
      title: '👥 Gioca Insieme (Famiglia, Wi-Fi di Casa & A Distanza)',
      subtitle: 'Pensato per bambini, nonni e famiglie — senza configurare alcun server:',
      passAndPlayTitle: '🤝 Passa e Gioca (Stesso Schermo)',
      passAndPlayDesc: 'Giocate in 2 sullo stesso PC o tablet. Uno schermo di cortesia nasconde le carte tra un turno e l’altro.',
      startPassAndPlay: '🎮 Inizia Passa e Gioca',
      lanTitle: '🏠 Tavolo in Casa (Wi-Fi / LAN)',
      lanDesc: 'Scegli una parola di 4 lettere o apri l’indirizzo su un altro PC, telefono o tablet collegato al Wi-Fi di casa:',
      roomWordLabel: 'Parola del Tavolo:',
      joinRoomBtn: 'Entra nel Tavolo',
      lanActiveStatus: '🟢 Server locale attivo automaticamente sul tuo PC',
      remoteTitle: '🌍 Gioca a Distanza (Codice Invito)',
      remoteDesc: 'Copia il codice della partita e invialo su WhatsApp o email a un parente lontano:',
      copyInviteBtn: 'Copia Codice Invito',
      pastePlaceholder: 'Incolla qui il codice ricevuto...',
      connectInviteBtn: 'Carica',
      copiedSuccess: '✅ Codice copiato negli appunti!',
    },
    multiplayerUI: {
      title: '👥 Gioca Insieme (Famiglia, Casa Wi-Fi & A Distanza)',
      subtitle: 'Scegli come giocare con amici, nonni o bambini senza alcuna configurazione tecnica:',
      passAndPlayTitle: '🤝 Passa e Gioca (Stesso Schermo)',
      passAndPlayDesc: 'Giocate in 2 sullo stesso PC o tablet. Uno schermo di cortesia copre le carte a ogni cambio turno.',
      passAndPlayStart: 'Inizia Passa e Gioca (2 Giocatori)',
      lanTitle: '🏠 In Casa su Wi-Fi (Rete Locale Automatica)',
      lanDesc: 'Collega due computer o tablet nella stessa casa usando una semplice parola di 4 lettere o il codice QR.',
      lanCreateBtn: '🏠 Crea Tavolo in Casa',
      lanJoinBtn: '🔑 Entra con Codice Parola',
      lanRoomLabel: 'Parola del Tavolo:',
      lanScanQr: 'Inquadra con il telefono/tablet sul Wi-Fi di casa oppure apri il link:',
      lanEnterCodePlaceholder: 'Es. SOLE',
      lanConnectBtn: 'Connetti al Tavolo',
      onlineTitle: '🌍 Gioca a Distanza (Parenti Lontani)',
      onlineDesc: 'Genera un codice invito da inviare su WhatsApp o email a un parente senza bisogno di account.',
      onlineCreateInviteBtn: '📤 Crea Codice Invito',
      onlineJoinInviteBtn: '📥 Incolla Codice Ricevuto',
      onlineCopyCodeBtn: '📋 Copia Codice Invito',
      onlineCopiedMsg: '✅ Codice copiato! Mandalo al tuo avversario.',
      onlinePastePrompt: 'Incolla qui il codice invito ricevuto:',
      privacyTitle: (name: string) => `Tocca a ${name}`,
      privacySubtitle: 'Passa il dispositivo al giocatore indicato. Le carte sono nascoste per non far sbirciare!',
      privacyReadyBtn: '👁️ Sono Pronto — Mostra le mie Carte',
      connectedBadge: (mode: string) => `🟢 ${mode}`,
    },
    categories: {
      scope: '🧹 Scope',
      carte: '🃏 Carte (21+)',
      denari: '🪙 Denari (6+)',
      setteBello: '⭐ Settebello (7 Denari)',
      primiera: '👑 Primiera',
      napola: '💎 Napola',
      reBello: '🤴 Re Bello (10 Denari)',
      totalHand: 'Punti della Mano',
      totalMatch: 'Totale Partita',
    },
    wizard: {
      title: '🎴 Configura Partita',
      selectGame: '1. Scegli il Gioco:',
      selectGameType: '1. Scegli il Gioco:',
      selectVariant: '2. Scegli la Variante:',
      selectBriscolaVariant: '2. Variante di Briscola:',
      selectPlayMode: '3. Modalità di Gioco:',
      playMode: '3. Con chi vuoi giocare?',
      vsComputer: '🤖 Contro il Computer',
      passAndPlay: '🤝 2 Giocatori sullo Stesso Schermo',
      modeSolo: '🤖 Contro il Computer',
      modePassAndPlay: '🤝 2 Giocatori sullo Stesso Schermo',
      modeLan: '🏠 Rete Casa Wi-Fi / A Distanza',
      selectDeck: '4. Mazzo di Carte Regionali:',
      aiDifficulty: '5. Livello del Computer:',
      relaxed: '🧒 Principiante (Per Bambini)',
      standard: '🧑 Normale (Famiglia)',
      expert: '🧠 Maestro del Circolo (Esperto)',
      atmosphere: '6. Tema del Tavolo:',
      trattoria: '🪵 Legno di Trattoria',
      salotto: '🟩 Panno Verde Classico',
      piazza: '🏛️ Marmo Veneziano',
      notte: '🌌 Notte Stellata',
      halloween: '🎃 Halloween Stregato',
      xmas: '🎄 Festa di Natale (Xmas)',
      bimbi: '🌈 Regno dei Bimbi',
      startGame: '🎮 Inizia a Giocare',
    },
  },
  en: {
    gameTitle: 'Scopa, Briscola, Tressette & Solitaire',
    scopa: 'Scopa',
    scopaMode: 'Scopa',
    briscola: 'Briscola',
    briscolaMode: 'Briscola',
    tressette: 'Tressette',
    tressetteMode: 'Tressette',
    solitario: 'Solitaire',
    close: 'Close',
    newGame: 'New Game',
    multiplayer: 'Play Together',
    multiplayerBtn: 'Play Together',
    simpleModeOn: '💡 Helper: ON',
    simpleModeOff: '💡 Helper: OFF',
    simpleModeDesc: 'Highlights legal captures and shows card point values for kids and beginners',
    credits: 'Credits & Licenses',
    settings: 'Game Setup',
    yourTurn: 'Your turn — Select a card from your hand',
    turnOf: 'Turn',
    opponentThinking: 'Computer is thinking...',
    waitingOpponent: "Waiting for opponent's turn...",
    playerTurn: (name: string) => `${name}'s Turn`,
    youPlayer: 'You',
    partnerPlayer: 'Partner',
    partnerLabel: 'Partner',
    opponentPlayer: 'Opponent',
    computer: 'Computer',
    computerN: (n: number) => `Computer ${n}`,
    team1: 'Team 1 (You)',
    team2: 'Team 2',
    target: 'Target',
    emptyTable: 'Empty table — Play a card',
    possibleCapture: 'Possible capture:',
    chooseCombination: 'Choose which table cards to capture:',
    chooseOption: 'Multiple captures available — Choose one:',
    optionBtn: (n: number) => `Capture Option ${n}`,
    playThisCard: '🃏 Play this Card',
    selectCardPrompt: 'Click a card to preview captures, or double-click to play it',
    cancel: 'Cancel',
    optionN: (n: number) => `Option ${n}`,
    scopaToast: (name: string) => `🧹 SCOPA by ${name}! (+1 Point)`,
    trickPointsToast: (name: string, pts: number) => `👑 Trick won by ${name}: +${pts} pts!`,
    handOver: 'Hand Complete — Score Breakdown',
    handEndedTitle: 'Hand Complete — Score Breakdown',
    matchEndedTitle: '🏆 Match Complete!',
    handLabel: (n: number) => `Hand #${n}`,
    winnerTitle: (name: string) => `🏆 Winner: ${name}!`,
    rematch: '🔄 Play Again',
    matchWonBy: (name: string) => `🏆 Match won by ${name}!`,
    matchTied: '🤝 Match ended in a tie (60 to 60)!',
    nextHand: 'Next Hand ➡️',
    playAgain: 'Play Again 🔄',
    backToGame: '⬅️ Back to Game',
    backToScopa: '⬅️ Back to Scopa / Briscola',
    restart: '🔄 Restart',
    moves: 'Moves',
    passes: 'Deck Passes',
    congratulations: 'CONGRATULATIONS!',
    solitaireWon: 'SOLITAIRE COMPLETED! ALL 40 CARDS ARE IN ORDER!',
    deckMenu: 'Deck',
    themeMenu: 'Table',
    tableMenu: 'Table',
    passDeviceTitle: (name: string) => `${name}'s Turn!`,
    passDeviceDesc: 'Pass the computer or tablet to the next player. Cards are hidden for privacy!',
    imReadyBtn: (name: string) => `👁️ I am ${name} — Show my cards`,
    deckStyles: {
      napoletane: 'Napoletane (Classic Neapolitan)',
      piacentine: 'Piacentine (Traditional)',
      bresciane: 'Bresciane (Dal Negro)',
      romagnole: 'Romagnole (Classic)',
      trevisane: 'Trevisane (Venetian)',
      bergamasche: 'Bergamasche (Lombard)',
      triestine: 'Triestine (Northeast)',
      moderne: 'Modern Fairy Tale (Kids Illustrated)',
    },
    themes: {
      salotto: '🟩 Classic Green Felt',
      trattoria: '🪵 Rustic Wood Table',
      piazza: '🏛️ Venetian Marble',
      notte: '🌌 Starry Night',
      halloween: '🎃 Spooky Halloween',
      xmas: '🎄 Christmas Holiday (Xmas)',
      bimbi: '🌈 Kids Wonderland',
    },
    briscolaPresets: {
      'classic-2p': {
        name: 'Classic Briscola (1 vs 1)',
        desc: 'Traditional 2-player duel (score 61+ out of 120 points)',
      },
      'teams-4p': {
        name: 'Partnership Briscola (2 vs 2)',
        desc: '4 players in 2 teams (You + Partner vs 2 Opponents)',
      },
      'scoperta-2p': {
        name: 'Open-Hand Briscola (Kids Mode)',
        desc: 'Opponent cards are visible to help kids learn strategy',
      },
      'fast-31': {
        name: 'Quick Briscola to 31',
        desc: 'Fast-paced variant: first player to reach 31 points wins!',
      },
    },
    briscolaUI: {
      trumpLabel: 'Trump (Briscola)',
      cardsInDeck: (n: number) => `${n} in deck`,
      deckEmpty: 'Deck empty',
      pointsLabel: 'Points',
      trickWonBy: (name: string, pts: number) =>
        pts > 0 ? `Trick won by ${name} (+${pts} pts)` : `Trick won by ${name} (0 pts)`,
      openHandBadge: '👁️ Open Hands',
      trumpStarBadge: '★ Trump',
      matchEndedTitle: 'Briscola Match Complete',
      yourPoints: 'Your Points (or Team)',
      opponentPoints: 'Opponent Points',
    },
    mp: {
      title: '👥 Play Together (Same Screen, Home Wi-Fi & Remote)',
      subtitle: 'Designed for kids, grandparents, and families — zero server configuration:',
      passAndPlayTitle: '🤝 Pass & Play (Same Screen)',
      passAndPlayDesc: '2 players share this PC or tablet. A courtesy screen hides cards between turns.',
      startPassAndPlay: '🎮 Start Pass & Play',
      lanTitle: '🏠 Home Table (Wi-Fi / LAN)',
      lanDesc: 'Pick a 4-letter word or open the address below on another PC, phone, or tablet on your Home Wi-Fi:',
      roomWordLabel: 'Table Word:',
      joinRoomBtn: 'Join Table',
      lanActiveStatus: '🟢 Local home server automatically active on your PC',
      remoteTitle: '🌍 Play Remotely (Invite Code)',
      remoteDesc: 'Copy the match invite code and send it via WhatsApp or email to family abroad:',
      copyInviteBtn: 'Copy Invite Code',
      pastePlaceholder: 'Paste received code here...',
      connectInviteBtn: 'Load',
      copiedSuccess: '✅ Code copied to clipboard!',
    },
    multiplayerUI: {
      title: '👥 Play Together (Same Screen, Home Wi-Fi & Remote)',
      subtitle: 'Play with kids, grandparents, or friends with zero technical setup:',
      passAndPlayTitle: '🤝 Pass & Play (Same Screen)',
      passAndPlayDesc: '2 players share this PC or tablet. A privacy screen hides cards between turns.',
      passAndPlayStart: 'Start Pass & Play (2 Players)',
      lanTitle: '🏠 Home Wi-Fi (Automatic Local Network)',
      lanDesc: 'Connect two computers or tablets at home using a simple 4-letter word or QR code.',
      lanCreateBtn: '🏠 Create Home Table',
      lanJoinBtn: '🔑 Join with Word Code',
      lanRoomLabel: 'Table Word Code:',
      lanScanQr: 'Scan with a phone/tablet on your home Wi-Fi or open the link:',
      lanEnterCodePlaceholder: 'e.g. SOLE',
      lanConnectBtn: 'Join Table',
      onlineTitle: '🌍 Play Remotely (Distant Relatives)',
      onlineDesc: 'Create an invite code to send via WhatsApp or email to family abroad—no accounts required.',
      onlineCreateInviteBtn: '📤 Create Invite Code',
      onlineJoinInviteBtn: '📥 Paste Received Code',
      onlineCopyCodeBtn: '📋 Copy Invite Code',
      onlineCopiedMsg: '✅ Code copied! Send it to your opponent.',
      onlinePastePrompt: 'Paste the invite code you received here:',
      privacyTitle: (name: string) => `Pass device to ${name}`,
      privacySubtitle: 'Cards are hidden while passing the screen so nobody peeks!',
      privacyReadyBtn: '👁️ I am Ready — Show My Cards',
      connectedBadge: (mode: string) => `🟢 ${mode}`,
    },
    categories: {
      scope: '🧹 Scope (Sweeps)',
      carte: '🃏 Cards (21+)',
      denari: '🪙 Coins (6+)',
      setteBello: '⭐ Settebello (7 of Coins)',
      primiera: '👑 Primiera (Prime)',
      napola: '💎 Napola (Coin Run)',
      reBello: '🤴 Re Bello (King of Coins)',
      totalHand: 'Hand Points',
      totalMatch: 'Total Match Score',
    },
    wizard: {
      title: '🎴 Game Setup',
      selectGame: '1. Choose Game:',
      selectGameType: '1. Choose Game:',
      selectVariant: '2. Choose Variant:',
      selectBriscolaVariant: '2. Briscola Variant:',
      selectPlayMode: '3. Play Mode:',
      playMode: '3. Who is playing?',
      vsComputer: '🤖 Against Computer (Solo)',
      passAndPlay: '🤝 2 Players on Same Screen',
      modeSolo: '🤖 Against Computer (Solo)',
      modePassAndPlay: '🤝 2 Players on Same Screen',
      modeLan: '🏠 Home Wi-Fi / Remote',
      selectDeck: '4. Regional Card Deck:',
      aiDifficulty: '5. Computer Difficulty:',
      relaxed: '🧒 Beginner (Kid Friendly)',
      standard: '🧑 Casual (Family)',
      expert: '🧠 Club Master (Expert)',
      atmosphere: '6. Table Theme:',
      trattoria: '🪵 Rustic Wood Table',
      salotto: '🟩 Classic Green Felt',
      piazza: '🏛️ Venetian Marble',
      notte: '🌌 Starry Night',
      halloween: '🎃 Spooky Halloween',
      xmas: '🎄 Christmas Holiday (Xmas)',
      bimbi: '🌈 Kids Wonderland',
      startGame: '🎮 Start Playing',
    },
  },
};

export function t(): Translations {
  return TRANSLATIONS[currentLang];
}

export function getPresetTitle(_id: ScopaPresetId, name: string, nameIt: string): string {
  return currentLang === 'it' ? nameIt : name;
}

export function getPresetDescription(_id: ScopaPresetId, desc: string, descIt: string): string {
  return currentLang === 'it' ? descIt : desc;
}
