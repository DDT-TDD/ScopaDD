import type { CardId } from '../core/cards/types';
import { cardName, cardNameIt, valueOf } from '../core/cards/types';
import {
  applyScopaCommand,
  createScopaMatch,
  type ScopaCommand,
  type ScopaEvent,
} from '../core/engine/scopa/engine';
import type { ScopaMatchSetup, ScopaMatchState } from '../core/engine/scopa/state';
import { PRESET_CONFIGS } from '../core/rules/scopa/config';
import { findLegalCaptures, type CaptureOption } from '../core/rules/scopa/capture';
import { chooseAIMove } from '../ai/policy';
import {
  applyBriscolaCommand,
  createBriscolaMatch,
  type BriscolaMatchSetup,
  type BriscolaMatchState,
} from '../core/engine/briscola/engine';
import { chooseBriscolaAIMove } from '../ai/briscolaPolicy';
import {
  createTressetteMatch,
  dispatchTressetteCommand,
  type TressetteMatchSetup,
  type TressetteMatchState,
} from '../core/engine/tressette/engine';
import type { TressetteSignal } from '../core/rules/tressette/types';
import { selectTressetteAiMove } from '../ai/tressettePolicy';
import { audio } from '../presentation/audio/audio';
import { Table3D, type TableAtmosphere } from '../presentation/table3d/table3d';
import { setActiveDeck, type DeckStyle } from '../presentation/cards';
import { getLang, t } from '../content/i18n';
import { HUD, type ActiveGameMode } from './hud';
import { TableView2D, type ScopaMoveChoreography } from './table2d';
import { HandView } from './hand';
import { ScoreCeremonyModal } from './scoreCeremony';
import { SetupWizardModal } from './wizard';
import { SolitarioView } from './solitarioView';
import { BriscolaView } from './briscolaView';
import { TressetteView } from './tressetteView';
import { MultiplayerModal } from './multiplayerModal';
import { CreditsModal } from './creditsModal';
import { randomSeed } from '../core/rng/prng';
import { WebRTCSession } from '../net/webrtc';

/** Choreography timings matching Briscola's natural pace */
const SCOPA_HOLD_MS = 900;
const SCOPA_SWEEP_MS = 450;
const SCOPA_AI_THINK_MS = 950;

export class ScopaApp {
  private root: HTMLElement;
  private activeMode: ActiveGameMode = 'scopa';
  private activeAtmosphere: TableAtmosphere = 'trattoria';
  private state: ScopaMatchState;
  private briscolaState: BriscolaMatchState;
  private tressetteState: TressetteMatchState;
  private hud: HUD;
  private table2d: TableView2D;
  private handView: HandView;
  private briscolaView: BriscolaView;
  private tressetteView: TressetteView;
  private solitarioView: SolitarioView | null = null;
  private scoreModal: ScoreCeremonyModal;
  private wizardModal: SetupWizardModal;
  private multiplayerModal: MultiplayerModal;
  private creditsModal: CreditsModal;
  private table3d: Table3D | null = null;
  private isSimpleMode: boolean = false;
  private isAIThinking: boolean = false;
  private scopaPrivacyOverlay: HTMLElement;
  private awaitingScopaPrivacyAck: boolean = false;

  // Scopa Interactive Capture Selection & Two-Phase Choreography
  private selectedHandCard: CardId | null = null;
  private hoveredOptionIdx: number = 0;
  private selectedTableCards: Set<CardId> = new Set();
  private scopaChoreography: ScopaMoveChoreography | null = null;
  private preChoreoState: ScopaMatchState | null = null;

  // LAN / BroadcastChannel / WebRTC P2P synchronization
  private clientId: string = Math.random().toString(36).slice(2, 10);
  private lanRoomCode: string | null = null;
  private lanHostAddress: string = window.location.hostname || '127.0.0.1';
  private lanPollInterval: number | null = null;
  private localMultiplayerSeat: number = 0; // 0 = Host / Player 1, 1 = Guest / Player 2
  private broadcastChannel: BroadcastChannel | null = null;
  private webrtcSession: WebRTCSession | null = null;
  private lastSyncedTimestamp: number = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.innerHTML = '';

    const tr = t();

    // 1. Default initial Scopa match setup
    const initialSetup: ScopaMatchSetup = {
      config: PRESET_CONFIGS.classic,
      seats: [
        { kind: 'human', name: tr.youPlayer, avatar: 'nonno' },
        { kind: 'ai', name: tr.computer, avatar: 'wolf', aiDifficulty: 'standard' },
      ],
      seed: randomSeed(),
    };
    this.state = createScopaMatch(initialSetup);

    // 2. Default initial Briscola match setup
    const initialBriscolaSetup: BriscolaMatchSetup = {
      presetId: 'classic-2p',
      playerCount: 2,
      partnerships: false,
      openHands: false,
      targetPoints: 61,
      seats: [
        { kind: 'human', name: tr.youPlayer, avatar: 'nonno' },
        { kind: 'ai', name: tr.computer, avatar: 'wolf', aiDifficulty: 'standard' },
      ],
      seed: randomSeed(),
    };
    this.briscolaState = createBriscolaMatch(initialBriscolaSetup);

    // 2B. Default initial Tressette match setup
    const initialTressetteSetup: TressetteMatchSetup = {
      variant: 'classic-2p',
      targetPoints: 21,
      seats: [
        { kind: 'human', name: tr.youPlayer, avatar: '🧑‍🌾' },
        { kind: 'ai', name: 'Franco', avatar: '🤖', aiDifficulty: 'standard' },
      ],
      seed: randomSeed(),
    };
    this.tressetteState = createTressetteMatch(initialTressetteSetup);

    // 3. 3D WebGL Background Canvas
    const canvas3dContainer = document.createElement('div');
    canvas3dContainer.id = 'canvas-3d';
    this.root.appendChild(canvas3dContainer);

    try {
      this.table3d = new Table3D(canvas3dContainer, 'trattoria');
    } catch (e) {
      console.warn('3D WebGL Tabletop initialization skipped (using 2D fallback):', e);
    }

    // 4. HUD
    this.hud = new HUD({
      onSelectMode: (mode) => this.switchGameMode(mode),
      onNewGame: () => this.wizardModal.show(this.activeMode),
      onOpenMultiplayer: () => this.multiplayerModal.show(),
      onOpenCredits: () => this.creditsModal.show(),
      onLanguageChange: () => this.handleLanguageChange(),
      onDeckChange: (deck: DeckStyle) => this.handleDeckChange(deck),
      onAtmosphereChange: (atmo: TableAtmosphere) => this.handleAtmosphereChange(atmo),
      onToggleSimpleMode: () => {
        this.isSimpleMode = !this.isSimpleMode;
        this.table2d.setShowHelperBadges(this.isSimpleMode);
        this.handView.setShowHelperBadges(this.isSimpleMode);
        this.briscolaView.setSimpleMode(this.isSimpleMode);
        this.tressetteView.setSimpleMode(this.isSimpleMode);
        this.solitarioView?.setShowHelperBadges(this.isSimpleMode);
        this.updateView();
      },
    });
    this.root.appendChild(this.hud.el);

    // 5. Scopa 2D Table View + Hand View + Pass-and-Play Privacy Overlay
    this.table2d = new TableView2D({
      onToggleTableCard: (tableCard) => this.handleToggleTableCard(tableCard),
    });
    this.root.appendChild(this.table2d.el);

    this.handView = new HandView({
      onSelectCard: (card, optionIdx) => this.handleCardSelection(card, optionIdx),
      onPlayCard: (card, optionIndex) =>
        this.handlePlayCard(this.getHumanControllableSeat(), card, optionIndex),
    });
    this.root.appendChild(this.handView.el);

    this.scopaPrivacyOverlay = document.createElement('div');
    this.scopaPrivacyOverlay.className = 'privacy-shield-overlay hidden';
    this.root.appendChild(this.scopaPrivacyOverlay);

    // 6. Briscola Table View
    this.briscolaView = new BriscolaView({
      onPlayCard: (seat, card) => this.handleBriscolaPlayCard(seat, card),
      onRematch: () => this.wizardModal.show('briscola'),
      onOpenWizard: () => this.wizardModal.show('briscola'),
    });
    this.briscolaView.el.style.display = 'none';
    this.root.appendChild(this.briscolaView.el);

    // 6B. Tressette Table View
    this.tressetteView = new TressetteView({
      onPlayCard: (seat, card, signal) => this.handleTressettePlayCard(seat, card, signal),
      onRematch: () => this.wizardModal.show('tressette'),
      onOpenWizard: () => this.wizardModal.show('tressette'),
    });
    this.tressetteView.el.style.display = 'none';
    this.root.appendChild(this.tressetteView.el);

    // 7. Modals
    this.scoreModal = new ScoreCeremonyModal({
      onAdvanceHand: () => {
        this.executeCommand({ type: 'advance-hand', seq: this.state.commandSeq + 1 });
      },
      onRematch: () => this.wizardModal.show('scopa'),
    });
    this.root.appendChild(this.scoreModal.el);

    this.wizardModal = new SetupWizardModal({
      onStartScopaMatch: (setup, atmosphere, deck) => {
        this.state = createScopaMatch(setup);
        this.scopaChoreography = null;
        this.preChoreoState = null;
        this.selectedHandCard = null;
        this.selectedTableCards.clear();
        this.awaitingScopaPrivacyAck = false;
        setActiveDeck(deck);
        this.handleAtmosphereChange(atmosphere);
        this.switchGameMode('scopa');
        audio.play('shuffle');
        this.broadcastStateSync();
        this.checkAITurn();
      },
      onStartBriscolaMatch: (setup, atmosphere, deck) => {
        this.briscolaState = createBriscolaMatch(setup);
        setActiveDeck(deck);
        this.handleAtmosphereChange(atmosphere);
        this.switchGameMode('briscola');
        audio.play('shuffle');
        this.broadcastStateSync();
        this.checkBriscolaAITurn();
      },
      onStartTressetteMatch: (setup, atmosphere, deck) => {
        this.tressetteState = createTressetteMatch(setup);
        setActiveDeck(deck);
        this.handleAtmosphereChange(atmosphere);
        this.switchGameMode('tressette');
        audio.play('shuffle');
        this.broadcastStateSync();
        this.checkTressetteAITurn();
      },
      onStartSolitario: (atmosphere, deck) => {
        setActiveDeck(deck);
        this.handleAtmosphereChange(atmosphere);
        this.switchGameMode('solitario');
      },
      onOpenMultiplayer: (tab) => {
        this.multiplayerModal.show(tab);
      },
    });
    this.root.appendChild(this.wizardModal.el);

    this.multiplayerModal = new MultiplayerModal({
      onStartPassAndPlay: () => {
        this.lanRoomCode = null;
        this.webrtcSession?.close();
        this.webrtcSession = null;
        this.localMultiplayerSeat = 0;
        this.wizardModal.startPassAndPlayDirectly(this.activeMode);
      },
      onStartLanRoom: (roomCode, isHost, hostIp) => {
        this.setupLanRoom(roomCode, isHost, hostIp);
      },
      onCreateOnlineOffer: () => this.createOnlineOffer(),
      onAcceptOnlineOffer: (offerCode) => this.acceptOnlineOffer(offerCode),
      onAcceptOnlineAnswer: (answerCode) => this.acceptOnlineAnswer(answerCode),
      onExportInviteCode: () => {
        const payload = {
          m: this.activeMode === 'briscola' ? 'briscola' : 'scopa',
          s: this.activeMode === 'briscola' ? this.briscolaState : this.state,
        };
        return btoa(encodeURIComponent(JSON.stringify(payload)));
      },
      onImportInviteCode: (code) => {
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(code)));
          if (decoded.m === 'briscola' && decoded.s) {
            this.briscolaState = decoded.s;
            this.switchGameMode('briscola');
            return true;
          } else if (decoded.s) {
            this.state = decoded.s;
            this.switchGameMode('scopa');
            return true;
          }
        } catch (e) {
          console.warn('Invalid invite code:', e);
        }
        return false;
      },
    });
    this.root.appendChild(this.multiplayerModal.el);

    this.creditsModal = new CreditsModal();
    this.root.appendChild(this.creditsModal.el);

    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      this.setupLanRoom(roomParam.toUpperCase(), false);
    }

    window.addEventListener('resize', () => {
      this.table3d?.resize();
    });

    audio.play('deal');
    this.updateView();
    this.checkAITurn();
  }

  private isNetworkMultiplayer(): boolean {
    return (
      this.lanRoomCode !== null ||
      (this.webrtcSession !== null && this.webrtcSession.getStatus() === 'connected')
    );
  }

  private getHumanControllableSeat(): number {
    if (this.isNetworkMultiplayer()) {
      return this.localMultiplayerSeat;
    }
    const active = this.state.activeSeat;
    if (this.state.setup.seats[active]?.kind === 'human') {
      return active;
    }
    return 0;
  }

  private isScopaPassAndPlay(): boolean {
    const humanCount = this.state.setup.seats.filter((s) => s.kind === 'human').length;
    return humanCount > 1 && !this.isNetworkMultiplayer();
  }

  private switchGameMode(mode: ActiveGameMode) {
    this.activeMode = mode;
    this.hud.setMode(mode);

    if (mode === 'solitario') {
      this.table2d.el.style.display = 'none';
      this.handView.el.style.display = 'none';
      this.briscolaView.el.style.display = 'none';
      this.tressetteView.el.style.display = 'none';
      this.scopaPrivacyOverlay.classList.add('hidden');

      if (!this.solitarioView) {
        this.solitarioView = new SolitarioView({
          onBackToScopa: () => this.switchGameMode('scopa'),
        });
        this.solitarioView.setAtmosphere(this.activeAtmosphere);
        this.solitarioView.setShowHelperBadges(this.isSimpleMode);
        this.root.appendChild(this.solitarioView.el);
      } else {
        this.solitarioView.el.style.display = 'flex';
        this.solitarioView.setAtmosphere(this.activeAtmosphere);
        this.solitarioView.setShowHelperBadges(this.isSimpleMode);
      }
      return;
    }

    if (this.solitarioView) {
      this.solitarioView.el.style.display = 'none';
    }

    if (mode === 'briscola') {
      this.table2d.el.style.display = 'none';
      this.handView.el.style.display = 'none';
      this.tressetteView.el.style.display = 'none';
      this.scopaPrivacyOverlay.classList.add('hidden');
      this.briscolaView.el.style.display = 'flex';
      this.briscolaView.setAtmosphere(this.activeAtmosphere);
      this.briscolaView.setSimpleMode(this.isSimpleMode);
      this.updateView();
      this.checkBriscolaAITurn();
      return;
    }

    if (mode === 'tressette') {
      this.table2d.el.style.display = 'none';
      this.handView.el.style.display = 'none';
      this.briscolaView.el.style.display = 'none';
      this.scopaPrivacyOverlay.classList.add('hidden');
      this.tressetteView.el.style.display = 'flex';
      this.tressetteView.setAtmosphere(this.activeAtmosphere);
      this.tressetteView.setSimpleMode(this.isSimpleMode);
      this.updateView();
      this.checkTressetteAITurn();
      return;
    }

    this.briscolaView.el.style.display = 'none';
    this.tressetteView.el.style.display = 'none';
    this.table2d.el.style.display = 'flex';
    this.handView.el.style.display = 'flex';
    this.updateView();
    this.checkAITurn();
  }

  private handleAtmosphereChange(atmo: TableAtmosphere) {
    this.activeAtmosphere = atmo;
    this.hud.setAtmosphere(atmo);
    this.wizardModal.setAtmosphere(atmo);
    this.table2d.setAtmosphere(atmo);
    this.briscolaView.setAtmosphere(atmo);
    this.tressetteView.setAtmosphere(atmo);
    this.solitarioView?.setAtmosphere(atmo);
    if (this.table3d) {
      this.table3d.setAtmosphere(atmo);
    }
  }

  private handleLanguageChange() {
    const tr = t();
    this.state.setup.seats.forEach((seat, idx) => {
      if (seat.kind === 'human' && idx === 0 && !this.isScopaPassAndPlay()) {
        seat.name = tr.youPlayer;
      } else if (seat.name.toLowerCase().includes('computer')) {
        seat.name = this.state.setup.seats.length > 2 ? tr.computerN(idx) : tr.computer;
      }
    });

    this.hud.render();
    this.updateView();
    if (this.solitarioView) {
      this.solitarioView.render();
    }
  }

  private handleDeckChange(deck: DeckStyle) {
    setActiveDeck(deck);
    this.updateView();
    if (this.solitarioView) {
      this.solitarioView.render();
    }
  }

  // =========================================================================
  // SCOPA LOGIC, MULTI-CAPTURE PICKER & BRISCOLA-STYLE CHOREOGRAPHY
  // =========================================================================

  private handleCardSelection(card: CardId | null, hoveredOptionIdx?: number) {
    if (this.scopaChoreography) return;

    if (card !== this.selectedHandCard) {
      this.selectedTableCards.clear();
      this.hoveredOptionIdx = 0;
    }
    this.selectedHandCard = card;
    if (hoveredOptionIdx !== undefined) {
      this.hoveredOptionIdx = hoveredOptionIdx;
    }

    this.updateView();
  }

  /**
   * Allows the player to click directly on table cards (e.g., clicking 5 then 2 on the table
   * when playing a 7) to choose their capture combination!
   */
  private handleToggleTableCard(tableCard: CardId) {
    if (this.selectedHandCard === null || this.scopaChoreography) return;
    const options = findLegalCaptures(
      this.selectedHandCard,
      this.state.table,
      this.state.setup.config
    );
    if (options.length <= 1) return;

    if (this.selectedTableCards.has(tableCard)) {
      this.selectedTableCards.delete(tableCard);
    } else {
      this.selectedTableCards.add(tableCard);
    }

    // Check if the toggled table cards now form a complete valid capture combination!
    const exactMatchIdx = options.findIndex(
      (opt) =>
        opt.capturedCards.length === this.selectedTableCards.size &&
        opt.capturedCards.every((c) => this.selectedTableCards.has(c))
    );

    if (exactMatchIdx >= 0) {
      const cardToPlay = this.selectedHandCard;
      this.selectedHandCard = null;
      this.selectedTableCards.clear();
      this.handView.setSelectedCard(null);
      this.handlePlayCard(this.getHumanControllableSeat(), cardToPlay, exactMatchIdx);
      return;
    }

    this.updateView();
  }

  private handlePlayCard(seat: number, card: CardId, captureOptionIndex: number = 0) {
    if (
      this.scopaChoreography ||
      this.state.activeSeat !== seat ||
      this.state.phase !== 'playing'
    ) {
      return;
    }

    const options = findLegalCaptures(card, this.state.table, this.state.setup.config);
    const chosenOpt =
      options.length > 0
        ? options[Math.min(captureOptionIndex, options.length - 1)]
        : null;
    const capturedCards = chosenOpt ? chosenOpt.capturedCards : [];

    // Save pre-move snapshot so table still shows the cards while the played card lands & pauses!
    const snapshot: ScopaMatchState = {
      ...this.state,
      hands: this.state.hands.map((h, idx) =>
        idx === seat ? h.filter((c) => c !== card) : [...h]
      ),
      table: [...this.state.table],
    };

    const nextSeq = this.state.commandSeq + 1;
    const prevSeat = this.state.activeSeat;
    const { state: nextState, events } = applyScopaCommand(this.state, {
      type: 'play',
      seat,
      card,
      captureOptionIndex,
      seq: nextSeq,
    });
    this.state = nextState;
    this.selectedHandCard = null;
    this.selectedTableCards.clear();
    this.handView.setSelectedCard(null);

    audio.play('play');

    // Start Briscola-style two-phase choreography so the user clearly sees the played card and captured cards!
    this.preChoreoState = snapshot;
    this.scopaChoreography = {
      seat,
      playedCard: card,
      capturedCards,
      phase: 'paused',
    };
    this.updateView();

    const holdTime = capturedCards.length > 0 ? SCOPA_HOLD_MS : 520;
    const sweepTime = capturedCards.length > 0 ? SCOPA_SWEEP_MS : 120;

    setTimeout(() => {
      if (this.scopaChoreography && capturedCards.length > 0) {
        this.scopaChoreography.phase = 'sweeping';
        audio.play('capture');
        this.updateView();
      }
    }, holdTime);

    setTimeout(() => {
      this.scopaChoreography = null;
      this.preChoreoState = null;

      if (
        this.isScopaPassAndPlay() &&
        this.state.phase === 'playing' &&
        this.state.activeSeat !== prevSeat
      ) {
        this.awaitingScopaPrivacyAck = true;
      }

      this.processEventsAfterChoreo(events);
      this.updateView();
      this.broadcastStateSync();
      this.checkAITurn();
    }, holdTime + sweepTime);
  }

  private executeCommand(command: ScopaCommand) {
    try {
      const { state: nextState, events } = applyScopaCommand(this.state, command);
      this.state = nextState;
      this.processEventsAfterChoreo(events);
      this.updateView();
      this.broadcastStateSync();
      this.checkAITurn();
    } catch (err) {
      console.error('Command execution failed:', err);
    }
  }

  private processEventsAfterChoreo(events: ScopaEvent[]) {
    const tr = t();
    for (const ev of events) {
      if (ev.type === 'ScopaScored') {
        audio.play('sweep');
        const s = this.state.setup.seats[ev.seat];
        const displayName =
          s.kind === 'human' && ev.seat === 0 && !this.isScopaPassAndPlay()
            ? tr.youPlayer
            : s.name.toLowerCase().includes('computer')
            ? tr.computerN(ev.seat)
            : s.name;
        this.table2d.showToast(tr.scopaToast(displayName), 2600);
      } else if (ev.type === 'HandEnded' || ev.type === 'MatchEnded') {
        this.awaitingScopaPrivacyAck = false;
        this.scoreModal.show(this.state);
      } else if (ev.type === 'RoundDealt') {
        audio.play('deal');
      }
    }
  }

  private checkAITurn() {
    if (
      this.activeMode !== 'scopa' ||
      this.state.phase !== 'playing' ||
      this.scopaChoreography !== null
    ) {
      return;
    }
    const activeSeat = this.state.activeSeat;
    const seatConfig = this.state.setup.seats[activeSeat];

    if (seatConfig.kind === 'ai' && !this.isAIThinking) {
      this.isAIThinking = true;
      const hand = this.state.hands[activeSeat];
      if (hand.length === 0) {
        this.isAIThinking = false;
        return;
      }

      setTimeout(() => {
        if (
          this.activeMode !== 'scopa' ||
          this.state.activeSeat !== activeSeat ||
          this.state.phase !== 'playing' ||
          this.scopaChoreography !== null
        ) {
          this.isAIThinking = false;
          return;
        }

        const difficulty = seatConfig.aiDifficulty ?? 'standard';
        const aiMove = chooseAIMove(
          hand,
          this.state.table,
          this.state.setup.config,
          difficulty
        );

        this.isAIThinking = false;
        this.handlePlayCard(activeSeat, aiMove.card, aiMove.captureOptionIndex ?? 0);
      }, SCOPA_AI_THINK_MS);
    }
  }

  // =========================================================================
  // BRISCOLA LOGIC
  // =========================================================================

  private handleBriscolaPlayCard(seat: number, card: CardId) {
    if (this.briscolaState.phase !== 'playing' || this.briscolaState.activeSeat !== seat) {
      return;
    }

    try {
      const { state: nextState } = applyBriscolaCommand(this.briscolaState, {
        type: 'play',
        seat,
        card,
        seq: this.briscolaState.commandSeq + 1,
      });
      this.briscolaState = nextState;
      audio.play('play');
      this.updateView();
      this.broadcastStateSync();

      if (this.briscolaState.phase === 'trick-ended') {
        setTimeout(() => {
          this.resolveBriscolaTrick();
        }, 1150);
      } else {
        this.checkBriscolaAITurn();
      }
    } catch (err) {
      console.error('Briscola move error:', err);
    }
  }

  private resolveBriscolaTrick() {
    if (this.briscolaState.phase !== 'trick-ended') return;
    try {
      const prevSeat = this.briscolaState.activeSeat;
      const { state: nextState, events } = applyBriscolaCommand(this.briscolaState, {
        type: 'advance-trick',
        seq: this.briscolaState.commandSeq + 1,
      });
      this.briscolaState = nextState;

      for (const ev of events) {
        if (ev.type === 'TrickWon') {
          if (ev.points > 0) {
            audio.play('capture');
            const winnerName =
              this.briscolaState.setup.seats[ev.winnerSeat]?.name || t().youPlayer;
            this.briscolaView.showToast(t().trickPointsToast(winnerName, ev.points), 1600);
          }
        } else if (ev.type === 'MatchEnded') {
          audio.play('sweep');
        }
      }

      const humanCount = this.briscolaState.setup.seats.filter((s) => s.kind === 'human').length;
      if (
        humanCount > 1 &&
        !this.isNetworkMultiplayer() &&
        this.briscolaState.phase === 'playing' &&
        this.briscolaState.activeSeat !== prevSeat
      ) {
        this.briscolaView.requirePrivacyConfirmation();
      }

      this.updateView();
      this.broadcastStateSync();
      this.checkBriscolaAITurn();
    } catch (err) {
      console.error('Briscola trick resolution error:', err);
    }
  }

  private checkBriscolaAITurn() {
    if (this.activeMode !== 'briscola' || this.briscolaState.phase !== 'playing') return;
    const activeSeat = this.briscolaState.activeSeat;
    const seatCfg = this.briscolaState.setup.seats[activeSeat];

    if (seatCfg?.kind === 'ai' && !this.isAIThinking) {
      this.isAIThinking = true;
      setTimeout(() => {
        this.isAIThinking = false;
        if (
          this.activeMode !== 'briscola' ||
          this.briscolaState.phase !== 'playing' ||
          this.briscolaState.activeSeat !== activeSeat
        ) {
          return;
        }
        const card = chooseBriscolaAIMove(
          this.briscolaState,
          activeSeat,
          seatCfg.aiDifficulty ?? 'standard'
        );
        this.handleBriscolaPlayCard(activeSeat, card);
      }, 850);
    }
  }

  // =========================================================================
  // TRESSETTE LOGIC
  // =========================================================================

  private handleTressettePlayCard(seat: number, card: CardId, signal?: TressetteSignal) {
    if (this.tressetteState.phase !== 'playing' || this.tressetteState.activeSeat !== seat) {
      return;
    }

    try {
      const { state: nextState } = dispatchTressetteCommand(this.tressetteState, {
        type: 'play',
        seat,
        card,
        signal,
        seq: this.tressetteState.commandSeq + 1,
      });
      this.tressetteState = nextState;
      audio.play('play');
      this.updateView();
      this.broadcastStateSync();

      if (this.tressetteState.phase === 'trick-ended') {
        setTimeout(() => {
          this.resolveTressetteTrickStep();
        }, 1200);
      } else {
        this.checkTressetteAITurn();
      }
    } catch (err) {
      console.error('Tressette move error:', err);
    }
  }

  private resolveTressetteTrickStep() {
    if (this.tressetteState.phase !== 'trick-ended') return;
    try {
      const prevSeat = this.tressetteState.activeSeat;
      const { state: nextState } = dispatchTressetteCommand(this.tressetteState, {
        type: 'advance-trick',
        seq: this.tressetteState.commandSeq + 1,
      });
      this.tressetteState = nextState;
      audio.play('capture');

      if (this.tressetteState.phase === 'match-ended') {
        audio.play('fanfare');
      }

      const humanCount = this.tressetteState.setup.seats.filter((s) => s.kind === 'human').length;
      if (
        humanCount > 1 &&
        !this.isNetworkMultiplayer() &&
        this.tressetteState.phase === 'playing' &&
        this.tressetteState.activeSeat !== prevSeat
      ) {
        this.tressetteView.requirePrivacyConfirmation();
      }

      this.updateView();
      this.broadcastStateSync();
      this.checkTressetteAITurn();
    } catch (err) {
      console.error('Tressette trick resolution error:', err);
    }
  }

  private checkTressetteAITurn() {
    if (this.activeMode !== 'tressette' || this.tressetteState.phase !== 'playing') return;
    const activeSeat = this.tressetteState.activeSeat;
    const seatCfg = this.tressetteState.setup.seats[activeSeat];

    if (seatCfg?.kind === 'ai' && !this.isAIThinking) {
      this.isAIThinking = true;
      setTimeout(() => {
        this.isAIThinking = false;
        if (
          this.activeMode !== 'tressette' ||
          this.tressetteState.phase !== 'playing' ||
          this.tressetteState.activeSeat !== activeSeat
        ) {
          return;
        }
        const decision = selectTressetteAiMove(this.tressetteState, activeSeat);
        this.handleTressettePlayCard(activeSeat, decision.card, decision.signal);
      }, 780);
    }
  }

  // =========================================================================
  // VIEW UPDATES & PASS-AND-PLAY PRIVACY SHIELD
  // =========================================================================

  private updateView() {
    const isNetwork = this.isNetworkMultiplayer();

    if (this.activeMode === 'briscola') {
      this.hud.updateBriscola(this.briscolaState);
      this.briscolaView.update(
        this.briscolaState,
        isNetwork ? this.localMultiplayerSeat : null
      );
      return;
    }

    if (this.activeMode === 'tressette') {
      this.hud.updateTressette(this.tressetteState);
      this.tressetteView.update(
        this.tressetteState,
        isNetwork ? this.localMultiplayerSeat : null
      );
      return;
    }

    if (this.activeMode === 'solitario') {
      return;
    }

    const displayState = this.preChoreoState ?? this.state;
    this.hud.updateScopa(this.state);

    const activeSeat = this.state.activeSeat;
    const isPassAndPlay = this.isScopaPassAndPlay();
    const displaySeat = isNetwork
      ? this.localMultiplayerSeat
      : isPassAndPlay
      ? activeSeat
      : 0;

    // Compute legal capture options & highlighted/capturable table cards for selected hand card
    let legalOptions: CaptureOption[] = [];
    const highlightedCards = new Set<CardId>();
    const capturableCards = new Set<CardId>();
    let mathHint = '';

    if (this.selectedHandCard !== null && !this.scopaChoreography) {
      legalOptions = findLegalCaptures(
        this.selectedHandCard,
        displayState.table,
        displayState.setup.config
      );

      if (legalOptions.length > 0) {
        const previewIdx = Math.min(this.hoveredOptionIdx, legalOptions.length - 1);
        const previewOpt = legalOptions[previewIdx];

        for (const c of previewOpt.capturedCards) {
          highlightedCards.add(c);
        }

        // Collect all cards that can still complete a valid capture given currently checked table cards
        for (const opt of legalOptions) {
          const isCompatible = Array.from(this.selectedTableCards).every((sel) =>
            opt.capturedCards.includes(sel)
          );
          if (isCompatible) {
            for (const c of opt.capturedCards) {
              capturableCards.add(c);
            }
          }
        }

        if (this.isSimpleMode) {
          const isIt = getLang() === 'it';
          if (previewOpt.capturedCards.length === 1) {
            const tableCard = previewOpt.capturedCards[0];
            const cName = isIt ? cardNameIt(tableCard) : cardName(tableCard);
            mathHint = `${cName} (${valueOf(tableCard)} = ${valueOf(this.selectedHandCard)})`;
          } else {
            const sumStr = previewOpt.capturedCards.map((c) => valueOf(c)).join(' + ');
            mathHint = `${sumStr} = ${valueOf(this.selectedHandCard)}`;
          }
        }
      }
    }

    this.table2d.update(displayState, {
      highlightedCardIds: highlightedCards,
      capturableCardIds: capturableCards,
      selectedTableCards: this.selectedTableCards,
      legalOptions,
      mathHint,
      choreography: this.scopaChoreography,
      viewingSeat: displaySeat,
    });

    if (
      isPassAndPlay &&
      this.awaitingScopaPrivacyAck &&
      this.state.phase === 'playing' &&
      !this.scopaChoreography
    ) {
      const tr = t();
      const nextName = this.state.setup.seats[activeSeat]?.name || tr.youPlayer;
      this.scopaPrivacyOverlay.classList.remove('hidden');
      this.scopaPrivacyOverlay.innerHTML = `
        <div class="privacy-shield-card">
          <div class="privacy-emoji">🙈</div>
          <h2>${tr.passDeviceTitle(nextName)}</h2>
          <p>${tr.passDeviceDesc}</p>
          <button class="btn-primary privacy-ready-btn">${tr.imReadyBtn(nextName)}</button>
        </div>
      `;
      this.scopaPrivacyOverlay
        .querySelector('.privacy-ready-btn')
        ?.addEventListener('click', () => {
          this.awaitingScopaPrivacyAck = false;
          this.scopaPrivacyOverlay.classList.add('hidden');
          this.updateView();
        });
      this.handView.update([], false);
      return;
    } else {
      this.scopaPrivacyOverlay.classList.add('hidden');
    }

    const isMyTurn =
      !this.scopaChoreography &&
      this.state.activeSeat === displaySeat &&
      this.state.setup.seats[displaySeat]?.kind === 'human' &&
      this.state.phase === 'playing';
    const myHand = displayState.hands[displaySeat] ?? [];
    this.handView.update(myHand, isMyTurn, legalOptions, this.selectedTableCards);
  }

  // =========================================================================
  // ZERO-CONFIG HOME WI-FI LAN, TAB SYNC & WEBRTC ONLINE P2P
  // =========================================================================

  private ensureWebRTCSession(): WebRTCSession {
    if (!this.webrtcSession) {
      this.webrtcSession = new WebRTCSession({
        onStatusChange: (status, role) => {
          this.multiplayerModal.updateP2PStatus(status, role);
          if (status === 'connected') {
            this.localMultiplayerSeat = role === 'host' ? 0 : 1;
            const isIt = getLang() === 'it';
            if (role === 'host') {
              if (this.activeMode === 'briscola') {
                this.briscolaState.setup.seats = [
                  { kind: 'human', name: isIt ? 'Giocatore 1 (Host)' : 'Player 1 (Host)', avatar: 'nonno' },
                  { kind: 'human', name: isIt ? 'Giocatore 2 (Online)' : 'Player 2 (Online)', avatar: 'volpe' },
                ];
              } else {
                this.state.setup.seats = [
                  { kind: 'human', name: isIt ? 'Giocatore 1 (Host)' : 'Player 1 (Host)', avatar: 'nonno' },
                  { kind: 'human', name: isIt ? 'Giocatore 2 (Online)' : 'Player 2 (Online)', avatar: 'volpe' },
                ];
              }
              this.updateView();
              this.broadcastStateSync();
            }
            const toastMsg = isIt
              ? `🟢 Connesso Online P2P come Giocatore ${this.localMultiplayerSeat + 1}!`
              : `🟢 Connected Online P2P as Player ${this.localMultiplayerSeat + 1}!`;
            if (this.activeMode === 'briscola') {
              this.briscolaView.showToast(toastMsg, 2600);
            } else {
              this.table2d.showToast(toastMsg, 2600);
            }
          }
        },
        onMessage: (raw) => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.senderId !== this.clientId && parsed.stateJson) {
              this.applyRemoteStatePayload(parsed.gameType || 'scopa', parsed.stateJson);
            }
          } catch (e) {
            console.warn('Invalid WebRTC message:', e);
          }
        },
      });
    }
    return this.webrtcSession;
  }

  private async createOnlineOffer(): Promise<string> {
    this.lanRoomCode = null;
    this.localMultiplayerSeat = 0;
    const session = this.ensureWebRTCSession();
    return session.createHostOffer();
  }

  private async acceptOnlineOffer(offerCode: string): Promise<string> {
    this.lanRoomCode = null;
    this.localMultiplayerSeat = 1;
    const session = this.ensureWebRTCSession();
    return session.acceptOfferAndCreateAnswer(offerCode);
  }

  private async acceptOnlineAnswer(answerCode: string): Promise<void> {
    const session = this.ensureWebRTCSession();
    await session.acceptGuestAnswer(answerCode);
  }

  private setupLanRoom(roomCode: string, isHost: boolean, hostIp?: string) {
    this.lanRoomCode = roomCode.toUpperCase();
    this.localMultiplayerSeat = isHost ? 0 : 1;
    if (hostIp && hostIp.trim()) {
      this.lanHostAddress = hostIp.trim().replace(/^https?:\/\//, '').replace(/:\d+.*$/, '');
    } else {
      this.lanHostAddress = window.location.hostname || '127.0.0.1';
    }
    const isIt = getLang() === 'it';

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(`scopa_room_${this.lanRoomCode}`);
      this.broadcastChannel.onmessage = (ev) => {
        if (ev.data && ev.data.senderId !== this.clientId) {
          this.applyRemoteStatePayload(ev.data.gameType, ev.data.stateJson);
        }
      };
    }

    if (isHost) {
      if (this.activeMode === 'briscola') {
        this.briscolaState.setup.seats = [
          { kind: 'human', name: isIt ? 'Giocatore 1 (Host)' : 'Player 1 (Host)', avatar: 'nonno' },
          { kind: 'human', name: isIt ? 'Giocatore 2 (Wi-Fi)' : 'Player 2 (Wi-Fi)', avatar: 'chef' },
        ];
      } else {
        this.state.setup.config = {
          ...this.state.setup.config,
          playerCount: 2,
          partnerships: false,
        };
        this.state.setup.seats = [
          { kind: 'human', name: isIt ? 'Giocatore 1 (Host)' : 'Player 1 (Host)', avatar: 'nonno' },
          { kind: 'human', name: isIt ? 'Giocatore 2 (Wi-Fi)' : 'Player 2 (Wi-Fi)', avatar: 'chef' },
        ];
        this.state = createScopaMatch(this.state.setup);
      }
      this.updateView();
      this.broadcastStateSync();
    } else {
      this.pollLanRoom();
    }

    const toastMsg = isIt
      ? `🏠 Tavolo Wi-Fi "${this.lanRoomCode}" attivo — Sei il Giocatore ${this.localMultiplayerSeat + 1}`
      : `🏠 Wi-Fi Table "${this.lanRoomCode}" active — You are Player ${this.localMultiplayerSeat + 1}`;
    if (this.activeMode === 'briscola') {
      this.briscolaView.showToast(toastMsg, 2600);
    } else {
      this.table2d.showToast(toastMsg, 2600);
    }

    if (this.lanPollInterval !== null) {
      window.clearInterval(this.lanPollInterval);
    }
    this.lanPollInterval = window.setInterval(() => {
      if (this.lanRoomCode) {
        this.pollLanRoom();
      }
    }, 950);
  }

  private async broadcastStateSync() {
    const gameType =
      this.activeMode === 'briscola'
        ? 'briscola'
        : this.activeMode === 'tressette'
        ? 'tressette'
        : 'scopa';
    const stateObj =
      gameType === 'briscola'
        ? this.briscolaState
        : gameType === 'tressette'
        ? this.tressetteState
        : this.state;
    const stateJson = JSON.stringify(stateObj);

    const payloadStr = JSON.stringify({
      senderId: this.clientId,
      gameType,
      stateJson,
    });

    if (this.webrtcSession && this.webrtcSession.getStatus() === 'connected') {
      this.webrtcSession.send(payloadStr);
    }

    if (!this.lanRoomCode) return;

    this.broadcastChannel?.postMessage({
      senderId: this.clientId,
      gameType,
      stateJson,
    });

    try {
      await fetch(
        `http://${this.lanHostAddress}:8135/api/room?code=${this.lanRoomCode}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
        }
      );
    } catch {
      // Offline / browser only
    }
  }

  private async pollLanRoom() {
    if (!this.lanRoomCode) return;
    try {
      const res = await fetch(
        `http://${this.lanHostAddress}:8135/api/room?code=${this.lanRoomCode}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (
        data.ok &&
        data.room &&
        data.room.senderId !== this.clientId &&
        data.room.updatedAt > this.lastSyncedTimestamp
      ) {
        this.lastSyncedTimestamp = data.room.updatedAt;
        this.applyRemoteStatePayload(data.room.gameType, data.room.stateJson);
      }
    } catch {
      // Offline / browser only
    }
  }

  private applyRemoteStatePayload(gameType: string, stateJson: string) {
    try {
      const parsed = JSON.parse(stateJson);
      if (gameType === 'briscola') {
        this.briscolaState = parsed;
        if (this.activeMode !== 'briscola') {
          this.switchGameMode('briscola');
        } else {
          this.updateView();
        }
      } else if (gameType === 'tressette') {
        this.tressetteState = parsed;
        if (this.activeMode !== 'tressette') {
          this.switchGameMode('tressette');
        } else {
          this.updateView();
        }
      } else {
        this.state = parsed;
        if (this.activeMode !== 'scopa') {
          this.switchGameMode('scopa');
        } else {
          this.updateView();
        }
      }
    } catch (e) {
      console.warn('Failed to parse synced LAN state:', e);
    }
  }
}
