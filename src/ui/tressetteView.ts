import {
  SUIT_NAMES_EN,
  SUIT_NAMES_IT,
  suitOf,
  type CardId,
} from '../core/cards/types';
import {
  createTressetteMatch,
  dispatchTressetteCommand,
  sideOfSeat,
  type TressetteMatchSetup,
  type TressetteMatchState,
  type TressetteVariantId,
} from '../core/engine/tressette/engine';
import {
  formatTerzi,
  getLegalTressetteMoves,
  tressetteTerziOf,
  type TressetteSignal,
} from '../core/rules/tressette/types';
import { randomSeed } from '../core/rng/prng';
import { selectTressetteAiMove } from '../ai/tressettePolicy';
import { createCardElement } from '../presentation/cards';
import { audio } from '../presentation/audio/audio';
import { getLang, t } from '../content/i18n';

export interface TressetteViewCallbacks {
  onPlayCard?: (seat: number, card: CardId, signal?: TressetteSignal) => void;
  onRematch?: () => void;
  onOpenWizard: () => void;
}

export class TressetteView {
  public el: HTMLElement;
  private state!: TressetteMatchState;
  private isSimpleMode: boolean = false;
  private isPassAndPlay: boolean = false;
  private fixedViewingSeat: number | null = null;
  private privacySeatWaiting: number | null = null;
  private pendingSignal: TressetteSignal = null;
  private showLastTrickModal: boolean = false;
  private aiTimer: number | null = null;
  private trickTimer: number | null = null;
  private callbacks: TressetteViewCallbacks;
  private toastEl!: HTMLElement;

  constructor(callbacks: TressetteViewCallbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('div');
    this.el.className = 'game-table-view tressette-view atmo-trattoria';
    this.startNewMatch('classic-2p', 'standard', false, 21);
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

  public update(state: TressetteMatchState, fixedViewingSeat: number | null = null) {
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

  public showToast(text: string, durationMs: number = 1900) {
    if (!this.toastEl) return;
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden');
    setTimeout(() => {
      this.toastEl?.classList.add('hidden');
    }, durationMs);
  }

  public startNewMatch(
    variant: TressetteVariantId = 'classic-2p',
    difficulty: 'relaxed' | 'standard' | 'expert' = 'standard',
    passAndPlay: boolean = false,
    targetPoints: number = 21
  ) {
    this.clearTimers();
    this.isPassAndPlay = passAndPlay;
    this.privacySeatWaiting = null;
    this.pendingSignal = null;
    this.showLastTrickModal = false;

    const is4P = variant === 'teams-4p' || variant === 'perdere-4p';
    const seats = is4P
      ? [
          { kind: 'human' as const, name: 'Tu', avatar: '🧑‍🌾' },
          { kind: 'ai' as const, name: 'Gennaro', avatar: '🦊', aiDifficulty: difficulty },
          { kind: 'ai' as const, name: 'Carmela', avatar: '👵', aiDifficulty: difficulty },
          { kind: 'ai' as const, name: 'Valerio', avatar: '🐺', aiDifficulty: difficulty },
        ]
      : [
          { kind: 'human' as const, name: passAndPlay ? 'Giocatore 1' : 'Tu', avatar: '🧑‍🌾' },
          passAndPlay
            ? { kind: 'human' as const, name: 'Giocatore 2', avatar: '🦊' }
            : { kind: 'ai' as const, name: 'Franco', avatar: '🤖', aiDifficulty: difficulty },
        ];

    const setup: TressetteMatchSetup = {
      seats,
      seed: randomSeed(),
      variant,
      targetPoints,
    };

    this.state = createTressetteMatch(setup);
    audio.play('shuffle');
    this.render();
    this.checkNextStep();
  }

  public setSimpleMode(enabled: boolean) {
    this.isSimpleMode = enabled;
    this.render();
  }

  public getState(): TressetteMatchState {
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

  private playCard(seat: number, card: CardId, signal?: TressetteSignal) {
    if (this.callbacks.onPlayCard) {
      this.callbacks.onPlayCard(seat, card, signal);
      this.pendingSignal = null;
      return;
    }
    if (this.state.phase !== 'playing' || this.state.activeSeat !== seat) return;

    const res = dispatchTressetteCommand(this.state, {
      type: 'play',
      seat,
      card,
      signal: signal ?? this.pendingSignal,
      seq: this.state.commandSeq + 1,
    });
    this.pendingSignal = null;
    this.state = res.state;
    audio.play('play');

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
        const res = dispatchTressetteCommand(this.state, {
          type: 'advance-trick',
          seq: this.state.commandSeq + 1,
        });
        this.state = res.state;
        audio.play('capture');

        if (this.state.phase === 'match-ended') {
          audio.play('fanfare');
        } else if (
          this.isPassAndPlay &&
          this.state.phase === 'playing' &&
          this.state.setup.seats[this.state.activeSeat]?.kind === 'human'
        ) {
          this.privacySeatWaiting = this.state.activeSeat;
        }

        this.render();
        this.checkNextStep();
      }, 1250);
      return;
    }

    if (this.state.phase === 'playing') {
      const active = this.state.activeSeat;
      const seatCfg = this.state.setup.seats[active];
      if (seatCfg?.kind === 'ai') {
        this.aiTimer = window.setTimeout(() => {
          const decision = selectTressetteAiMove(this.state, active);
          this.playCard(active, decision.card, decision.signal);
        }, 720);
      }
    }
  }

  private seatLabel(seat: number): string {
    const tr = t();
    const s = this.state.setup.seats[seat];
    if (!s) return '';
    if (this.isPassAndPlay || this.fixedViewingSeat !== null) return s.name;
    if (seat === 0) return tr.youPlayer;
    if (this.state.partnerships && seat === 2) return `${tr.partnerPlayer} (${s.name})`;
    return s.name || tr.opponentPlayer;
  }

  private signalLabel(sig: TressetteSignal, lang: 'it' | 'en'): string {
    if (sig === 'busso') return lang === 'it' ? '✊ Busso!' : '✊ Busso (Knock)!';
    if (sig === 'striscio') return lang === 'it' ? '🌊 Striscio!' : '🌊 Striscio (Slide)!';
    if (sig === 'volo') return lang === 'it' ? '🕊️ Volo!' : '🕊️ Volo (Last of suit)!';
    return '';
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

    const topSeat = numSeats === 4 ? (viewingSeat + 2) % 4 : (viewingSeat + 1) % 2;
    const mySide = sideOfSeat(this.state, viewingSeat);
    const oppSide = mySide === 0 ? 1 : 0;

    // 1. Top Opponent / Partner Bar
    const topSection = document.createElement('div');
    topSection.className = 'briscola-top-area tressette-top-area';

    if (numSeats === 4) {
      // Show Left Opponent, Partner (Top), Right Opponent badges
      const leftSeat = (viewingSeat + 3) % 4;
      const rightSeat = (viewingSeat + 1) % 4;
      for (const sIdx of [leftSeat, topSeat, rightSeat]) {
        const side = sideOfSeat(this.state, sIdx);
        const badge = document.createElement('div');
        badge.className = `opponent-badge ${this.state.activeSeat === sIdx ? 'in-attesa-di-te' : ''}`;
        const seatAccusi = this.state.accusiBySeat[sIdx] ?? [];
        const accusiTag =
          seatAccusi.length > 0
            ? `<div style="font-size:0.74rem; color:#4ade80; font-weight:700;">📣 ${seatAccusi
                .map((a) => (lang === 'it' ? a.labelIt : a.labelEn))
                .join(', ')}</div>`
            : '';
        badge.innerHTML = `
          <span class="opp-avatar">${this.state.setup.seats[sIdx]?.avatar ?? '🦊'}</span>
          <div class="opp-details">
            <div class="opp-name">${this.seatLabel(sIdx)} (${this.state.hands[sIdx]?.length ?? 0} 🃏)</div>
            <div class="opp-stats">👑 ${formatTerzi(this.state.terziBySide[side] ?? 0)} pt (${lang === 'it' ? 'Tot' : 'Match'}: <b>${this.state.cumulativeScores[side] ?? 0}</b>/${this.state.targetPoints})</div>
            ${accusiTag}
          </div>
        `;
        topSection.appendChild(badge);
      }
    } else {
      const topSide = sideOfSeat(this.state, topSeat);
      const topInfo = document.createElement('div');
      topInfo.className = `opponent-badge ${this.state.activeSeat === topSeat ? 'in-attesa-di-te' : ''}`;
      const oppAccusi = this.state.accusiBySeat[topSeat] ?? [];
      const accusiHtml =
        oppAccusi.length > 0
          ? `<div style="font-size:0.75rem; color:#4ade80; font-weight:700;">📣 ${oppAccusi
              .map((a) => (lang === 'it' ? a.labelIt : a.labelEn))
              .join(', ')}</div>`
          : '';
      topInfo.innerHTML = `
        <span class="opp-avatar">${this.state.setup.seats[topSeat]?.avatar ?? '🤖'}</span>
        <div class="opp-details">
          <div class="opp-name">${this.seatLabel(topSeat)}</div>
          <div class="opp-stats">👑 ${lang === 'it' ? 'Mano' : 'Hand'}: <b>${formatTerzi(
        this.state.terziBySide[topSide] ?? 0
      )}</b> pt | 🏆 ${lang === 'it' ? 'Totale' : 'Match'}: <b>${
        this.state.cumulativeScores[topSide] ?? 0
      }</b> / ${this.state.targetPoints}</div>
          ${accusiHtml}
        </div>
      `;
      topSection.appendChild(topInfo);

      const topCards = document.createElement('div');
      topCards.className = 'briscola-opp-hand';
      const topCount = Math.min(this.state.hands[topSeat]?.length ?? 0, 10);
      for (let i = 0; i < topCount; i++) {
        const cardEl = createCardElement(0, { faceDown: true, lang });
        cardEl.classList.add('opp-mini-card');
        topCards.appendChild(cardEl);
      }
      topSection.appendChild(topCards);
    }
    this.el.appendChild(topSection);

    // 2. Middle Arena (Trick Zone + Info/Tallone Aside)
    const middleSection = document.createElement('div');
    middleSection.className = 'briscola-middle-area';

    const trickZone = document.createElement('div');
    trickZone.className = 'briscola-trick-zone tressette-trick-zone';

    if (this.state.currentTrick.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'empty-table-msg';
      const ledHint =
        lang === 'it'
          ? `Mano #${this.state.handNumber} • Presa ${this.state.trickNumber}/10${
              this.state.isPerdere ? ' • 🎭 A Perdere (meno punti vince!)' : ''
            }`
          : `Hand #${this.state.handNumber} • Trick ${this.state.trickNumber}/10${
              this.state.isPerdere ? ' • 🎭 Traversone (lowest score wins!)' : ''
            }`;
      emptyEl.textContent = ledHint;
      trickZone.appendChild(emptyEl);
    } else {
      const ledSuit = suitOf(this.state.currentTrick[0].card);
      const ledSuitName =
        lang === 'it' ? SUIT_NAMES_IT[ledSuit] : SUIT_NAMES_EN[ledSuit];

      const suitBanner = document.createElement('div');
      suitBanner.className = 'tressette-led-suit-banner';
      suitBanner.innerHTML =
        lang === 'it'
          ? `🎯 Seme di mano: <b>${ledSuitName}</b> (Obbligo di rispondere)`
          : `🎯 Led suit: <b>${ledSuitName}</b> (Must follow suit)`;
      trickZone.appendChild(suitBanner);

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
        const ownerTag = document.createElement('div');
        ownerTag.className = 'played-card-owner';
        ownerTag.textContent = this.seatLabel(play.seat);

        wrap.appendChild(cEl);
        if (play.signal) {
          const sigPill = document.createElement('div');
          sigPill.className = 'tressette-signal-bubble';
          sigPill.textContent = this.signalLabel(play.signal, lang);
          wrap.appendChild(sigPill);
        }
        wrap.appendChild(ownerTag);
        trickZone.appendChild(wrap);
      }
    }
    middleSection.appendChild(trickZone);

    // Right-Side Tallone / Status / Drawn Cards Reveal / Ultima Presa Button
    const talloneZone = document.createElement('aside');
    talloneZone.className = 'briscola-tallone-zone tressette-aside-zone';

    if (this.state.deck.length > 0) {
      const deckEl = createCardElement(0, { faceDown: true, lang });
      deckEl.classList.add('tallone-deck-card');
      talloneZone.appendChild(deckEl);

      const countLbl = document.createElement('div');
      countLbl.className = 'tallone-count';
      countLbl.textContent = tr.briscolaUI.cardsInDeck(this.state.deck.length);
      talloneZone.appendChild(countLbl);
    }

    // Drawn Cards Reveal ("Pescata Scoperta" in 2P Tressette)
    if (this.state.lastDrawnCards.length > 0) {
      const drawnBox = document.createElement('div');
      drawnBox.className = 'tressette-drawn-reveal';
      drawnBox.innerHTML = `<div class="drawn-reveal-title">👁️ ${
        lang === 'it' ? 'Ultima Pescata' : 'Drawn Cards'
      }</div>`;
      const drawnRow = document.createElement('div');
      drawnRow.className = 'drawn-reveal-cards';
      for (const d of this.state.lastDrawnCards) {
        const dWrap = document.createElement('div');
        dWrap.className = 'drawn-mini-item';
        const miniC = createCardElement(d.card, { lang });
        miniC.classList.add('mini-open-card');
        const lbl = document.createElement('span');
        lbl.textContent = this.seatLabel(d.seat);
        dWrap.appendChild(miniC);
        dWrap.appendChild(lbl);
        drawnRow.appendChild(dWrap);
      }
      drawnBox.appendChild(drawnRow);
      talloneZone.appendChild(drawnBox);
    }

    // Scoreboard Pill in Aside
    const myScorePill = document.createElement('div');
    myScorePill.className = 'briscola-trump-pill';
    myScorePill.innerHTML = `👑 ${this.seatLabel(viewingSeat)}: <b>${formatTerzi(
      this.state.terziBySide[mySide] ?? 0
    )}</b> pt (${lang === 'it' ? 'Tot' : 'Match'}: <b>${
      this.state.cumulativeScores[mySide] ?? 0
    }</b>/${this.state.targetPoints})`;
    talloneZone.appendChild(myScorePill);

    // Inspect Last Trick ("Ultima Presa") button
    if (this.state.lastCompletedTrick.length > 0) {
      const lastTrickBtn = document.createElement('button');
      lastTrickBtn.className = 'btn-pill btn-last-trick';
      lastTrickBtn.innerHTML = `🔍 ${lang === 'it' ? 'Ultima Presa' : 'Last Trick'}`;
      lastTrickBtn.addEventListener('click', () => {
        this.showLastTrickModal = true;
        this.render();
      });
      talloneZone.appendChild(lastTrickBtn);
    }

    middleSection.appendChild(talloneZone);
    this.el.appendChild(middleSection);

    // 3. Bottom Player Hand & Signal Bar
    const bottomSection = document.createElement('div');
    bottomSection.className = 'hand-view tressette-hand-view';

    const canPlay =
      this.state.phase === 'playing' &&
      this.state.activeSeat === viewingSeat &&
      this.privacySeatWaiting === null;

    // Accusi Announcement Banner for Player
    const myAccusi = this.state.accusiBySeat[viewingSeat] ?? [];
    if (myAccusi.length > 0 && this.state.trickNumber <= 2) {
      const accBanner = document.createElement('div');
      accBanner.className = 'tressette-accusi-banner';
      accBanner.innerHTML = `📣 <b>${lang === 'it' ? 'Accuso dichiarato:' : 'Declared Accuso:'}</b> ${myAccusi
        .map((a) => (lang === 'it' ? a.labelIt : a.labelEn))
        .join(' • ')}`;
      bottomSection.appendChild(accBanner);
    }

    // Partner Signals Bar (Busso / Striscio / Volo) when leading a trick in 4P Partnerships
    if (canPlay && this.state.partnerships && this.state.currentTrick.length === 0) {
      const sigBar = document.createElement('div');
      sigBar.className = 'tressette-sigbar';
      const sigTitle = document.createElement('span');
      sigTitle.className = 'sigbar-label';
      sigTitle.textContent = lang === 'it' ? 'Segnale al compagno:' : 'Partner signal:';
      sigBar.appendChild(sigTitle);

      const signals: Array<{ id: TressetteSignal; labelIt: string; labelEn: string }> = [
        { id: null, labelIt: 'Nessuno', labelEn: 'None' },
        { id: 'busso', labelIt: '✊ Busso', labelEn: '✊ Busso' },
        { id: 'striscio', labelIt: '🌊 Striscio', labelEn: '🌊 Striscio' },
        { id: 'volo', labelIt: '🕊️ Volo', labelEn: '🕊️ Volo' },
      ];
      for (const sOpt of signals) {
        const btn = document.createElement('button');
        btn.className = `word-chip ${this.pendingSignal === sOpt.id ? 'active' : ''}`;
        btn.textContent = lang === 'it' ? sOpt.labelIt : sOpt.labelEn;
        btn.addEventListener('click', () => {
          this.pendingSignal = sOpt.id;
          this.render();
        });
        sigBar.appendChild(btn);
      }
      bottomSection.appendChild(sigBar);
    }

    const promptBar = document.createElement('div');
    promptBar.className = 'hand-prompt';

    if (this.state.phase === 'trick-ended' && this.state.trickWinnerSeat !== null) {
      const tPts = formatTerzi(
        this.state.currentTrick.reduce(
          (s, p) => s + tressetteTerziOf(p.card, this.state.isPerdere),
          0
        )
      );
      promptBar.textContent =
        lang === 'it'
          ? `Presa vinta da ${this.seatLabel(this.state.trickWinnerSeat)} (+${tPts} pt)`
          : `Trick won by ${this.seatLabel(this.state.trickWinnerSeat)} (+${tPts} pts)`;
      promptBar.classList.add('active-turn');
    } else if (canPlay) {
      if (this.state.currentTrick.length > 0) {
        const ledSuit = suitOf(this.state.currentTrick[0].card);
        const sName = lang === 'it' ? SUIT_NAMES_IT[ledSuit] : SUIT_NAMES_EN[ledSuit];
        promptBar.textContent =
          lang === 'it'
            ? `${tr.yourTurn} — Rispondi a ${sName}`
            : `${tr.yourTurn} — Follow suit (${sName})`;
      } else {
        promptBar.textContent = `${tr.yourTurn} (${formatTerzi(
          this.state.terziBySide[mySide] ?? 0
        )} pt)`;
      }
      promptBar.classList.add('active-turn');
    } else {
      promptBar.textContent = `${this.seatLabel(this.state.activeSeat)}: ${tr.opponentThinking}`;
    }
    bottomSection.appendChild(promptBar);

    const handCardsRow = document.createElement('div');
    handCardsRow.className = 'hand-cards-row tressette-hand-row';
    const myHand = this.state.hands[viewingSeat] ?? [];
    const legalMoves = new Set(getLegalTressetteMoves(myHand, this.state.currentTrick));

    for (const card of myHand) {
      const isLegal = legalMoves.has(card);
      const terzi = tressetteTerziOf(card, this.state.isPerdere);
      let badgeText: string | undefined;
      let badgeClass = '';

      if (this.isSimpleMode) {
        if (terzi === 33) {
          badgeText = '+11 pt';
          badgeClass = 'badge-trump';
        } else if (terzi === 3) {
          badgeText = '1 pt';
          badgeClass = 'badge-pts';
        } else if (terzi === 1) {
          badgeText = '⅓ pt';
          badgeClass = 'badge-rank-num';
        }
      }

      const cardEl = createCardElement(card, {
        selectable: canPlay && isLegal,
        lang,
        badgeText,
        badgeClass,
        onClick: () => {
          if (!canPlay) return;
          if (!isLegal) {
            const ledSuit = suitOf(this.state.currentTrick[0].card);
            const sName = lang === 'it' ? SUIT_NAMES_IT[ledSuit] : SUIT_NAMES_EN[ledSuit];
            audio.play('click');
            this.showToast(
              lang === 'it'
                ? `⚠️ Devi rispondere al seme di mano (${sName})!`
                : `⚠️ You must follow the led suit (${sName})!`
            );
            return;
          }
          this.playCard(viewingSeat, card, this.pendingSignal);
        },
      });
      if (!canPlay) {
        cardEl.classList.add('disabled');
      } else if (!isLegal) {
        cardEl.classList.add('card-dimmed-illegal');
      }
      handCardsRow.appendChild(cardEl);
    }
    bottomSection.appendChild(handCardsRow);
    this.el.appendChild(bottomSection);

    this.toastEl = document.createElement('div');
    this.toastEl.className = 'scopa-toast hidden';
    this.el.appendChild(this.toastEl);

    // 4. Last Trick Inspector Modal ("Ultima Presa")
    if (this.showLastTrickModal && this.state.lastCompletedTrick.length > 0) {
      const ltModal = document.createElement('div');
      ltModal.className = 'modal-backdrop';
      const cardsHtmlWrap = document.createElement('div');
      cardsHtmlWrap.style.display = 'flex';
      cardsHtmlWrap.style.justifyContent = 'center';
      cardsHtmlWrap.style.gap = '16px';
      cardsHtmlWrap.style.margin = '18px 0';

      for (const play of this.state.lastCompletedTrick) {
        const slot = document.createElement('div');
        slot.className = 'played-trick-slot';
        const cEl = createCardElement(play.card, { lang });
        if (this.state.lastTrickWinnerSeat === play.seat) {
          cEl.classList.add('winning-trick-card');
        }
        const tag = document.createElement('div');
        tag.className = 'played-by-tag';
        tag.textContent = `${this.seatLabel(play.seat)}${
          this.state.lastTrickWinnerSeat === play.seat ? ' 🏆' : ''
        }`;
        slot.appendChild(cEl);
        slot.appendChild(tag);
        cardsHtmlWrap.appendChild(slot);
      }

      const cardBox = document.createElement('div');
      cardBox.className = 'modal-card';
      cardBox.style.textAlign = 'center';
      cardBox.innerHTML = `<h2>🔍 ${
        lang === 'it' ? 'Ultima Presa Giocata' : 'Last Completed Trick'
      }</h2>`;
      cardBox.appendChild(cardsHtmlWrap);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn-primary';
      closeBtn.textContent = tr.close;
      closeBtn.addEventListener('click', () => {
        this.showLastTrickModal = false;
        this.render();
      });
      cardBox.appendChild(closeBtn);
      ltModal.appendChild(cardBox);
      this.el.appendChild(ltModal);
    }

    // 5. Privacy Overlay for Pass-and-Play
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

    // 6. Hand-Ended or Match-Ended Ceremony Modal
    if (
      (this.state.phase === 'hand-ended' || this.state.phase === 'match-ended') &&
      this.state.lastHandSummary
    ) {
      const sum = this.state.lastHandSummary;
      const isMatchEnd = this.state.phase === 'match-ended';
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';

      const myHandPts = sum.totalHandPointsBySide[mySide] ?? 0;
      const oppHandPts = sum.totalHandPointsBySide[oppSide] ?? 0;
      const myTot = sum.cumulativeScores[mySide] ?? 0;
      const oppTot = sum.cumulativeScores[oppSide] ?? 0;

      const titleText = isMatchEnd
        ? lang === 'it'
          ? '🏆 Partita di Tressette Conclusa!'
          : '🏆 Tressette Match Complete!'
        : `${tr.handEndedTitle} #${sum.handNumber}`;

      const winnerText = isMatchEnd
        ? this.state.winnerSide === mySide
          ? tr.matchWonBy(this.seatLabel(viewingSeat))
          : tr.matchWonBy(this.seatLabel(topSeat))
        : lang === 'it'
        ? `Ultima presa (+1 pt): ${
            sum.ultimaSide === mySide ? this.seatLabel(viewingSeat) : this.seatLabel(topSeat)
          }`
        : `Last trick (+1 pt): ${
            sum.ultimaSide === mySide ? this.seatLabel(viewingSeat) : this.seatLabel(topSeat)
          }`;

      modal.innerHTML = `
        <div class="modal-card">
          <h2>${titleText}</h2>
          <h3 style="text-align:center; color:#f59e0b; margin:10px 0;">${winnerText}</h3>
          <div class="score-table" style="margin:16px 0;">
            <div class="score-row">
              <div class="score-cat">${this.seatLabel(viewingSeat)} (${lang === 'it' ? 'Mano' : 'Hand'})</div>
              <div class="score-val">+${myHandPts} pt (${formatTerzi(sum.terziBySide[mySide] ?? 0)} carte${
        sum.ultimaSide === mySide ? ' +1 Ultima' : ''
      }${sum.accusiPointsBySide[mySide] ? ` +${sum.accusiPointsBySide[mySide]} Accusi` : ''})</div>
            </div>
            <div class="score-row">
              <div class="score-cat">${this.seatLabel(topSeat)} (${lang === 'it' ? 'Mano' : 'Hand'})</div>
              <div class="score-val">+${oppHandPts} pt (${formatTerzi(sum.terziBySide[oppSide] ?? 0)} carte${
        sum.ultimaSide === oppSide ? ' +1 Ultima' : ''
      }${sum.accusiPointsBySide[oppSide] ? ` +${sum.accusiPointsBySide[oppSide]} Accusi` : ''})</div>
            </div>
            <div class="score-row total-row" style="border-top:1px solid rgba(255,255,255,0.2); padding-top:10px;">
              <div class="score-cat">${lang === 'it' ? 'Punteggio Totale' : 'Match Score'}</div>
              <div class="score-val" style="color:#4ade80;">${myTot} — ${oppTot} (Target: ${
        this.state.targetPoints
      })</div>
            </div>
          </div>
          <div class="modal-actions" style="gap:12px;">
            <button class="btn-pill tressette-settings-btn">⚙️ ${tr.settings}</button>
            <button class="btn-primary tressette-continue-btn">${
              isMatchEnd ? tr.playAgain : tr.nextHand
            }</button>
          </div>
        </div>
      `;

      modal.querySelector('.tressette-continue-btn')?.addEventListener('click', () => {
        if (isMatchEnd) {
          this.startNewMatch(
            this.state.variant,
            this.state.setup.seats[1]?.aiDifficulty ?? 'standard',
            this.isPassAndPlay,
            this.state.targetPoints
          );
        } else {
          const res = dispatchTressetteCommand(this.state, {
            type: 'next-hand',
            seq: this.state.commandSeq + 1,
          });
          this.state = res.state;
          audio.play('deal');
          this.render();
          this.checkNextStep();
        }
      });

      modal.querySelector('.tressette-settings-btn')?.addEventListener('click', () => {
        this.callbacks.onOpenWizard();
      });

      this.el.appendChild(modal);
    }
  }
}
