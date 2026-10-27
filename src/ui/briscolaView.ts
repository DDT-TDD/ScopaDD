import {
  SUIT_NAMES_EN,
  SUIT_NAMES_IT,
  suitOf,
  type CardId,
} from '../core/cards/types';
import { briscolaPointsOf } from '../core/rules/briscola/types';
import {
  applyBriscolaCommand,
  createBriscolaMatch,
  type BriscolaMatchSetup,
  type BriscolaMatchState,
  type BriscolaVariantId,
} from '../core/engine/briscola/engine';
import { randomSeed } from '../core/rng/prng';
import { chooseBriscolaAIMove } from '../ai/briscolaPolicy';
import { createCardElement } from '../presentation/cards';
import { audio } from '../presentation/audio/audio';
import { getLang, t } from '../content/i18n';

export interface BriscolaViewCallbacks {
  onPlayCard?: (seat: number, card: CardId) => void;
  onRematch?: () => void;
  onOpenWizard: () => void;
}

export class BriscolaView {
  public el: HTMLElement;
  private state!: BriscolaMatchState;
  private isSimpleMode: boolean = false;
  private isPassAndPlay: boolean = false;
  private fixedViewingSeat: number | null = null;
  private privacySeatWaiting: number | null = null;
  private aiTimer: number | null = null;
  private trickTimer: number | null = null;
  private callbacks: BriscolaViewCallbacks;
  private toastEl!: HTMLElement;

  constructor(callbacks: BriscolaViewCallbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('div');
    this.el.className = 'game-table-view briscola-view atmo-trattoria';
    this.startNewMatch('classic-2p', 'standard', false);
  }

  public setAtmosphere(atmosphere: string) {
    this.el.classList.remove(
      'atmo-trattoria',
      'atmo-piazza',
      'atmo-salotto',
      'atmo-notte',
      'atmo-halloween',
      'atmo-xmas',
      'atmo-bimbi'
    );
    this.el.classList.add(`atmo-${atmosphere}`);
  }

  public update(state: BriscolaMatchState, fixedViewingSeat: number | null = null) {
    this.state = state;
    this.fixedViewingSeat = fixedViewingSeat;
    const humanCount = state.setup.seats.filter((s) => s.kind === 'human').length;
    this.isPassAndPlay = humanCount > 1 && fixedViewingSeat === null;
    this.render();
  }

  public requirePrivacyConfirmation() {
    this.privacySeatWaiting = this.state.activeSeat;
    this.render();
  }

  public showToast(text: string, durationMs: number = 1800) {
    if (!this.toastEl) return;
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden');
    setTimeout(() => {
      this.toastEl?.classList.add('hidden');
    }, durationMs);
  }

  public startNewMatch(
    variant: BriscolaVariantId = 'classic-2p',
    difficulty: 'relaxed' | 'standard' | 'expert' = 'standard',
    passAndPlay: boolean = false
  ) {
    this.clearTimers();
    this.isPassAndPlay = passAndPlay;
    this.privacySeatWaiting = null;

    const is4P = variant === 'teams-4p';
    const seats = is4P
      ? [
          { kind: 'human' as const, name: 'Tu', avatar: '🧑‍🌾' },
          { kind: 'ai' as const, name: 'Avversario 1', avatar: '🦊', aiDifficulty: difficulty },
          { kind: 'ai' as const, name: 'Compagno', avatar: '👵', aiDifficulty: difficulty },
          { kind: 'ai' as const, name: 'Avversario 2', avatar: '🐺', aiDifficulty: difficulty },
        ]
      : [
          { kind: 'human' as const, name: passAndPlay ? 'Giocatore 1' : 'Tu', avatar: '🧑‍🌾' },
          passAndPlay
            ? { kind: 'human' as const, name: 'Giocatore 2', avatar: '🦊' }
            : { kind: 'ai' as const, name: 'Computer', avatar: '🤖', aiDifficulty: difficulty },
        ];

    const setup: BriscolaMatchSetup = {
      seats,
      seed: randomSeed(),
      variant,
      immediateSweep: false,
    };

    this.state = createBriscolaMatch(setup);
    audio.play('shuffle');
    this.render();
    this.checkNextStep();
  }

  public setSimpleMode(enabled: boolean) {
    this.isSimpleMode = enabled;
    this.render();
  }

  public getState(): BriscolaMatchState {
    return this.state;
  }

  public show() {
    this.el.classList.remove('hidden');
    this.render();
    this.checkNextStep();
  }

  public hide() {
    this.clearTimers();
    this.el.classList.add('hidden');
  }

  private clearTimers() {
    if (this.aiTimer !== null) {
      window.clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
    if (this.trickTimer !== null) {
      window.clearTimeout(this.trickTimer);
      this.trickTimer = null;
    }
  }

  private playCard(seat: number, card: CardId) {
    if (this.callbacks.onPlayCard) {
      this.callbacks.onPlayCard(seat, card);
      return;
    }
    if (this.state.phase !== 'playing' || this.state.activeSeat !== seat) return;

    const res = applyBriscolaCommand(this.state, {
      type: 'play',
      seat,
      card,
      seq: this.state.commandSeq + 1,
    });
    this.state = res.state;
    audio.play('play');

    // If Pass-and-Play and next seat is another human in 'playing' phase, activate privacy screen
    if (
      this.isPassAndPlay &&
      this.state.phase === 'playing' &&
      this.state.setup.seats[this.state.activeSeat]?.kind === 'human'
    ) {
      this.privacySeatWaiting = this.state.activeSeat;
    }

    this.render();
    this.checkNextStep();
  }

  private checkNextStep() {
    this.clearTimers();
    if (this.el.classList.contains('hidden')) return;

    if (this.state.phase === 'trick-ended') {
      this.trickTimer = window.setTimeout(() => {
        const res = applyBriscolaCommand(this.state, {
          type: 'advance-trick',
          seq: this.state.commandSeq + 1,
        });
        this.state = res.state;
        audio.play('capture');

        if (this.state.phase === 'match-ended') {
          audio.play('fanfare');
        } else if (
          this.isPassAndPlay &&
          this.state.setup.seats[this.state.activeSeat]?.kind === 'human'
        ) {
          this.privacySeatWaiting = this.state.activeSeat;
        }

        this.render();
        this.checkNextStep();
      }, 1150);
      return;
    }

    if (this.state.phase === 'playing') {
      const active = this.state.activeSeat;
      const seatCfg = this.state.setup.seats[active];
      if (seatCfg?.kind === 'ai') {
        this.aiTimer = window.setTimeout(() => {
          const move = chooseBriscolaAIMove(this.state, active);
          this.playCard(active, move);
        }, 650);
      }
    }
  }

  private seatLabel(seat: number): string {
    const tr = t();
    const s = this.state.setup.seats[seat];
    if (!s) return '';
    if (this.isPassAndPlay || this.fixedViewingSeat !== null) return s.name;
    if (seat === 0) return tr.youPlayer;
    if (this.state.setup.seats.length === 4 && seat === 2) return tr.partnerPlayer;
    return this.state.setup.seats.length === 4 ? `${tr.opponentPlayer} ${seat === 1 ? 1 : 2}` : tr.opponentPlayer;
  }

  public render() {
    const tr = t();
    const lang = getLang();
    this.el.innerHTML = '';

    const numSeats = this.state.setup.seats.length;
    const viewingSeat =
      this.fixedViewingSeat !== null
        ? this.fixedViewingSeat
        : this.isPassAndPlay && this.state.setup.seats[this.state.activeSeat]?.kind === 'human'
        ? this.privacySeatWaiting !== null
          ? this.privacySeatWaiting
          : this.state.activeSeat
        : 0;

    const topSeat = numSeats === 4 ? 2 : (viewingSeat + 1) % 2;
    const mySide = numSeats === 4 ? viewingSeat % 2 : viewingSeat;
    const oppSide = mySide === 0 ? 1 : 0;

    const suitName =
      lang === 'it'
        ? SUIT_NAMES_IT[this.state.trumpSuit]
        : SUIT_NAMES_EN[this.state.trumpSuit];

    // 1. Top Opponent / Partner Bar
    const topSection = document.createElement('div');
    topSection.className = 'briscola-top-area';

    const topInfo = document.createElement('div');
    topInfo.className = 'opponent-badge';
    topInfo.innerHTML = `
      <span class="opp-avatar">${this.state.setup.seats[topSeat]?.avatar ?? '🦊'}</span>
      <div class="opp-details">
        <div class="opp-name">${this.seatLabel(topSeat)}</div>
        <div class="opp-stats">🪙 ${tr.briscolaUI.pointsLabel}: <b>${this.state.pointsBySide[numSeats === 4 ? topSeat % 2 : topSeat] ?? 0}</b> / 120</div>
      </div>
    `;
    topSection.appendChild(topInfo);

    const topCards = document.createElement('div');
    topCards.className = 'briscola-opp-hand';
    const topHand = this.state.hands[topSeat] ?? [];
    for (const c of topHand) {
      const cardEl = createCardElement(c, {
        faceDown: !this.state.openHands,
        lang,
      });
      cardEl.classList.add('opp-mini-card');
      topCards.appendChild(cardEl);
    }
    topSection.appendChild(topCards);
    this.el.appendChild(topSection);

    // 2. Middle Arena (Trick + Tallone Draw Pile & Trump Card)
    const middleSection = document.createElement('div');
    middleSection.className = 'briscola-middle-area';

    // Center Trick Table
    const trickZone = document.createElement('div');
    trickZone.className = 'briscola-trick-zone';

    if (this.state.currentTrick.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'empty-table-msg';
      emptyEl.textContent = tr.emptyTable;
      trickZone.appendChild(emptyEl);
    } else {
      for (const play of this.state.currentTrick) {
        const wrap = document.createElement('div');
        wrap.className = `briscola-played-card-wrap ${
          play.seat === viewingSeat ? 'gioca-dal-basso' : 'gioca-dallalto'
        }`;
        if (
          this.state.phase === 'trick-ended' &&
          this.state.trickWinnerSeat === play.seat
        ) {
          wrap.classList.add('winning-trick-card');
        }

        const cEl = createCardElement(play.card, { lang });
        const pts = briscolaPointsOf(play.card);
        const ownerTag = document.createElement('div');
        ownerTag.className = 'played-card-owner';
        ownerTag.textContent = `${this.seatLabel(play.seat)}${pts > 0 ? ` (+${pts})` : ''}`;

        wrap.appendChild(cEl);
        wrap.appendChild(ownerTag);
        trickZone.appendChild(wrap);
      }
    }
    middleSection.appendChild(trickZone);

    // Right-Side Tallone (Rotated Briscola Trump + Deck)
    const talloneZone = document.createElement('aside');
    talloneZone.className = 'briscola-tallone-zone';

    const remainingTotal = this.state.deck.length + (this.state.trumpTaken ? 0 : 1);
    if (remainingTotal > 0) {
      const stack = document.createElement('div');
      stack.className = 'tallone-stack';

      // Face-up Trump card rotated 90 deg underneath
      const trumpEl = createCardElement(this.state.trumpCard, { lang });
      trumpEl.classList.add('tallone-trump-card');
      stack.appendChild(trumpEl);

      // Face-down deck card on top if deck.length > 0
      if (this.state.deck.length > 0) {
        const deckEl = createCardElement(0, { faceDown: true, lang });
        deckEl.classList.add('tallone-deck-card');
        stack.appendChild(deckEl);
      }
      talloneZone.appendChild(stack);

      const countLbl = document.createElement('div');
      countLbl.className = 'tallone-count';
      countLbl.textContent = tr.briscolaUI.cardsInDeck(remainingTotal);
      talloneZone.appendChild(countLbl);
    } else {
      const emptyDeck = document.createElement('div');
      emptyDeck.className = 'tallone-count';
      emptyDeck.textContent = tr.briscolaUI.deckEmpty;
      talloneZone.appendChild(emptyDeck);
    }

    const trumpPill = document.createElement('div');
    trumpPill.className = 'briscola-trump-pill';
    trumpPill.innerHTML = `★ ${tr.briscolaUI.trumpLabel}: <b>${suitName}</b>`;
    talloneZone.appendChild(trumpPill);

    middleSection.appendChild(talloneZone);
    this.el.appendChild(middleSection);

    // 3. Bottom Player Hand & Status
    const bottomSection = document.createElement('div');
    bottomSection.className = 'hand-view';

    const promptBar = document.createElement('div');
    promptBar.className = 'hand-prompt';
    const canPlay =
      this.state.phase === 'playing' &&
      this.state.activeSeat === viewingSeat &&
      this.privacySeatWaiting === null;

    if (this.state.phase === 'trick-ended' && this.state.trickWinnerSeat !== null) {
      const trickPts = this.state.currentTrick.reduce(
        (s, p) => s + briscolaPointsOf(p.card),
        0
      );
      promptBar.textContent = tr.briscolaUI.trickWonBy(
        this.seatLabel(this.state.trickWinnerSeat),
        trickPts
      );
      promptBar.classList.add('active-turn');
    } else if (canPlay) {
      promptBar.textContent = `${tr.yourTurn} (${this.seatLabel(viewingSeat)}: ${this.state.pointsBySide[mySide]} pt)`;
      promptBar.classList.add('active-turn');
    } else {
      promptBar.textContent = tr.opponentThinking;
    }
    bottomSection.appendChild(promptBar);

    const handCardsRow = document.createElement('div');
    handCardsRow.className = 'hand-cards-row';
    const myHand = this.state.hands[viewingSeat] ?? [];

    for (const card of myHand) {
      const pts = briscolaPointsOf(card);
      const isTrump = suitOf(card) === this.state.trumpSuit;
      let badgeText: string | undefined;
      let badgeClass = '';

      if (this.isSimpleMode) {
        if (isTrump && pts > 0) {
          badgeText = `★ +${pts} pt`;
          badgeClass = 'badge-trump-pts';
        } else if (isTrump) {
          badgeText = tr.briscolaUI.trumpStarBadge;
          badgeClass = 'badge-trump';
        } else if (pts > 0) {
          badgeText = `+${pts} pt`;
          badgeClass = 'badge-pts';
        }
      }

      const cardEl = createCardElement(card, {
        selectable: canPlay,
        lang,
        badgeText,
        badgeClass,
        onClick: () => {
          if (canPlay) this.playCard(viewingSeat, card);
        },
      });
      if (!canPlay) cardEl.classList.add('disabled');
      handCardsRow.appendChild(cardEl);
    }
    bottomSection.appendChild(handCardsRow);
    this.el.appendChild(bottomSection);

    this.toastEl = document.createElement('div');
    this.toastEl.className = 'scopa-toast hidden';
    this.el.appendChild(this.toastEl);

    // 4. Privacy Overlay for Pass-and-Play
    if (this.privacySeatWaiting !== null) {
      const priv = document.createElement('div');
      priv.className = 'modal-backdrop';
      priv.innerHTML = `
        <div class="modal-card" style="text-align:center;">
          <h2>🤝 ${tr.multiplayerUI.privacyTitle(this.seatLabel(this.privacySeatWaiting))}</h2>
          <p style="margin: 14px 0 22px; color:#cbd5e1;">${tr.multiplayerUI.privacySubtitle}</p>
          <button class="btn-primary privacy-unlock-btn">${tr.multiplayerUI.privacyReadyBtn}</button>
        </div>
      `;
      priv.querySelector('.privacy-unlock-btn')?.addEventListener('click', () => {
        this.privacySeatWaiting = null;
        this.render();
      });
      this.el.appendChild(priv);
    }

    // 5. Match Ended Ceremony Modal
    if (this.state.phase === 'match-ended') {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      const myPts = this.state.pointsBySide[mySide] ?? 0;
      const oppPts = this.state.pointsBySide[oppSide] ?? 0;
      const winText =
        this.state.winner === -1
          ? tr.matchTied
          : this.state.winner === mySide
          ? tr.matchWonBy(this.seatLabel(viewingSeat))
          : tr.matchWonBy(this.seatLabel(topSeat));

      modal.innerHTML = `
        <div class="modal-card">
          <h2>${tr.briscolaUI.matchEndedTitle}</h2>
          <h3 style="text-align:center; color:#f59e0b; margin:12px 0;">${winText}</h3>
          <div class="score-table" style="margin:18px 0;">
            <div class="score-row total-row">
              <div class="score-cat">${tr.briscolaUI.yourPoints}</div>
              <div class="score-val" style="color:#4ade80;">${myPts} / 120</div>
            </div>
            <div class="score-row total-row">
              <div class="score-cat">${tr.briscolaUI.opponentPoints}</div>
              <div class="score-val">${oppPts} / 120</div>
            </div>
          </div>
          <div class="modal-actions" style="gap:12px;">
            <button class="btn-pill briscola-settings-btn">⚙️ ${tr.settings}</button>
            <button class="btn-primary briscola-again-btn">${tr.playAgain}</button>
          </div>
        </div>
      `;
      modal.querySelector('.briscola-again-btn')?.addEventListener('click', () => {
        this.startNewMatch(
          this.state.variant,
          this.state.setup.seats[1]?.aiDifficulty ?? 'standard',
          this.isPassAndPlay
        );
      });
      modal.querySelector('.briscola-settings-btn')?.addEventListener('click', () => {
        this.callbacks.onOpenWizard();
      });
      this.el.appendChild(modal);
    }
  }
}
