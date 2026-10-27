import { cardName, cardNameIt, valueOf, type CardId } from '../core/cards/types';
import type { ScopaMatchState } from '../core/engine/scopa/state';
import type { CaptureOption } from '../core/rules/scopa/capture';
import { createCardElement } from '../presentation/cards';
import { getAvatar } from '../safety/avatars';
import { getLang, t } from '../content/i18n';

export interface ScopaMoveChoreography {
  seat: number;
  playedCard: CardId;
  capturedCards: readonly CardId[];
  phase: 'paused' | 'sweeping';
}

export interface TableView2DCallbacks {
  onToggleTableCard?: (card: CardId) => void;
}

export class TableView2D {
  public el: HTMLElement;
  private tableCardsContainer: HTMLElement;
  private opponentsContainer: HTMLElement;
  private talloneContainer: HTMLElement;
  private toastEl: HTMLElement;
  private currentAtmosphere: string = 'trattoria';
  private showHelperBadges: boolean = false;
  private callbacks: TableView2DCallbacks;

  public setShowHelperBadges(show: boolean) {
    this.showHelperBadges = show;
  }

  constructor(callbacks: TableView2DCallbacks = {}) {
    this.callbacks = callbacks;
    this.el = document.createElement('main');
    this.el.className = 'game-table-view atmo-trattoria';

    this.opponentsContainer = document.createElement('div');
    this.opponentsContainer.className = 'opponents-bar';
    this.el.appendChild(this.opponentsContainer);

    const middleArena = document.createElement('div');
    middleArena.className = 'scopa-middle-arena';

    this.tableCardsContainer = document.createElement('div');
    this.tableCardsContainer.className = 'table-felt';
    middleArena.appendChild(this.tableCardsContainer);

    this.talloneContainer = document.createElement('aside');
    this.talloneContainer.className = 'scopa-tallone-aside';
    middleArena.appendChild(this.talloneContainer);

    this.el.appendChild(middleArena);

    this.toastEl = document.createElement('div');
    this.toastEl.className = 'scopa-toast hidden';
    this.el.appendChild(this.toastEl);
  }

  getAtmosphere(): string {
    return this.currentAtmosphere;
  }

  setAtmosphere(atmosphere: string) {
    this.el.classList.remove(
      'atmo-trattoria',
      'atmo-piazza',
      'atmo-salotto',
      'atmo-notte',
      'atmo-halloween',
      'atmo-xmas',
      'atmo-bimbi'
    );
    this.currentAtmosphere = atmosphere;
    this.el.classList.add(`atmo-${atmosphere}`);
  }

  update(
    state: ScopaMatchState,
    options: {
      highlightedCardIds?: Set<CardId>;
      capturableCardIds?: Set<CardId>;
      selectedTableCards?: Set<CardId>;
      legalOptions?: readonly CaptureOption[];
      mathHint?: string;
      choreography?: ScopaMoveChoreography | null;
      viewingSeat?: number;
    } = {}
  ) {
    const seats = state.setup.seats;
    const tr = t();
    const isIt = getLang() === 'it';
    const highlightedCardIds = options.highlightedCardIds ?? new Set<CardId>();
    const capturableCardIds = options.capturableCardIds ?? new Set<CardId>();
    const selectedTableCards = options.selectedTableCards ?? new Set<CardId>();
    const legalOptions = options.legalOptions ?? [];
    const mathHint = options.mathHint;
    const choreography = options.choreography ?? null;
    const viewingSeat = options.viewingSeat ?? 0;

    // 1. Render Opponents with visual card backs and captured pile stats
    this.opponentsContainer.innerHTML = '';
    for (let s = 0; s < seats.length; s++) {
      if (s === viewingSeat) continue; // Local player seat is rendered at the bottom

      const seat = seats[s];
      const avatar = getAvatar(seat.avatar);
      const isTurn = s === state.activeSeat && !choreography;
      const cardCount = state.hands[s]?.length ?? 0;
      const sideIdx = state.setup.config.partnerships ? s % 2 : s;
      const capCount = state.capturedBySide[sideIdx]?.length ?? 0;
      const scopeCount = state.scopeCountBySide[sideIdx] ?? 0;

      const displayName =
        seat.kind === 'human' && s === viewingSeat
          ? tr.youPlayer
          : seat.name.toLowerCase().includes('computer')
          ? tr.computerN(s)
          : seat.name;

      const oppEl = document.createElement('div');
      oppEl.className = `opponent-pill ${isTurn ? 'active-turn' : ''}`;
      oppEl.innerHTML = `
        <span class="avatar-badge" style="background:${avatar.color}">${avatar.emoji}</span>
        <div class="opp-info">
          <span class="opp-name">${displayName}</span>
          <span class="opp-cards">🃏 ${capCount} ${isIt ? 'prese' : 'taken'} ${scopeCount > 0 ? `• 🧹 ${scopeCount} Scope` : ''}</span>
        </div>
        <div class="opp-hand-backs"></div>
      `;

      const backsRow = oppEl.querySelector('.opp-hand-backs')!;
      for (let i = 0; i < cardCount; i++) {
        const miniBack = createCardElement(0, { faceDown: true });
        miniBack.classList.add('opp-mini-back');
        backsRow.appendChild(miniBack);
      }

      this.opponentsContainer.appendChild(oppEl);
    }

    // 2. Render Table Cards & Choreography
    this.tableCardsContainer.innerHTML = '';
    const isInteractiveSelect = legalOptions.length > 1 && !choreography;

    if (state.table.length === 0 && !choreography) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-table-msg';
      emptyMsg.textContent = tr.emptyTable;
      this.tableCardsContainer.appendChild(emptyMsg);
    } else {
      let index = 0;
      for (const card of state.table) {
        const isHighlighted = highlightedCardIds.has(card);
        const isChecked = selectedTableCards.has(card);
        const isCapturable = capturableCardIds.has(card);
        const isBeingCaptured = choreography?.capturedCards.includes(card) ?? false;

        const cardEl = createCardElement(card, {
          selectable: isInteractiveSelect && (isCapturable || isChecked),
          badgeText: this.showHelperBadges ? `${valueOf(card)}` : undefined,
          badgeClass: this.showHelperBadges ? 'badge-rank-num' : undefined,
          onClick: () => {
            if (isInteractiveSelect && (isCapturable || isChecked)) {
              this.callbacks.onToggleTableCard?.(card);
            }
          },
        });

        const rot = ((index * 7) % 7) - 3;
        cardEl.style.setProperty('--card-rot', `${rot}deg`);

        if (isBeingCaptured && choreography) {
          if (choreography.phase === 'paused') {
            cardEl.classList.add('scopa-card-captured-hold');
          } else {
            cardEl.classList.add(
              choreography.seat === 0 ? 'vola-giu' : 'vola-su'
            );
          }
        } else {
          cardEl.style.transform = `rotate(${rot}deg)`;
        }

        if (isHighlighted || isChecked) {
          cardEl.classList.add('highlight-capture');
        }

        if (isInteractiveSelect) {
          if (isChecked) {
            cardEl.classList.add('table-card-checked');
          } else if (isCapturable) {
            cardEl.classList.add('table-card-capturable');
          } else {
            cardEl.classList.add('table-card-dimmed');
          }
        }

        this.tableCardsContainer.appendChild(cardEl);
        index++;
      }

      // If choreography is active, also show the played card on the table so players see what was played!
      if (choreography) {
        const playedWrap = document.createElement('div');
        playedWrap.className = 'scopa-played-choreo-wrap';
        const playedEl = createCardElement(choreography.playedCard, {
          badgeText: this.showHelperBadges ? `${valueOf(choreography.playedCard)}` : undefined,
          badgeClass: this.showHelperBadges ? 'badge-trump' : undefined,
        });

        if (choreography.phase === 'paused') {
          playedEl.classList.add(
            choreography.seat === 0 ? 'gioca-dal-basso' : 'gioca-dallalto',
            'scopa-played-card-focus'
          );
        } else if (choreography.capturedCards.length > 0) {
          playedEl.classList.add(choreography.seat === 0 ? 'vola-giu' : 'vola-su');
        }

        const seatInfo = seats[choreography.seat];
        const sName =
          seatInfo?.kind === 'human' && choreography.seat === 0
            ? tr.youPlayer
            : seatInfo?.name || tr.computer;
        const cLabel = isIt
          ? cardNameIt(choreography.playedCard)
          : cardName(choreography.playedCard);

        const tag = document.createElement('div');
        tag.className = 'played-card-owner';
        tag.textContent =
          choreography.capturedCards.length > 0
            ? `✨ ${sName} ${isIt ? 'prende con' : 'takes with'} ${cLabel}`
            : `🃏 ${sName} ${isIt ? 'cala' : 'plays'} ${cLabel}`;

        playedWrap.appendChild(playedEl);
        playedWrap.appendChild(tag);
        this.tableCardsContainer.appendChild(playedWrap);
      }
    }

    // 3. Render Math Hint or Multiple-Capture Instruction Banner
    if (isInteractiveSelect) {
      const hintBadge = document.createElement('div');
      hintBadge.className = 'math-hint-badge multi-choice-banner';
      hintBadge.innerHTML = `👆 <b>${
        isIt
          ? 'Più prese possibili! Tocca le carte sul tavolo o scegli la combinazione qui sotto:'
          : 'Multiple captures possible! Click cards on the table or pick a combination below:'
      }</b>`;
      this.tableCardsContainer.appendChild(hintBadge);
    } else if (mathHint && !choreography) {
      const hintBadge = document.createElement('div');
      hintBadge.className = 'math-hint-badge';
      hintBadge.innerHTML = `💡 <b>${tr.possibleCapture}</b> ${mathHint}`;
      this.tableCardsContainer.appendChild(hintBadge);
    }

    // 4. Render Deck / Tallone & Player Captured Pile Counter on Right Side
    this.talloneContainer.innerHTML = '';
    const mySideIdx = state.setup.config.partnerships ? viewingSeat % 2 : viewingSeat;
    const myCapturedCount = state.capturedBySide[mySideIdx]?.length ?? 0;
    const myScopeCount = state.scopeCountBySide[mySideIdx] ?? 0;

    if (state.deck.length > 0) {
      const deckWrap = document.createElement('div');
      deckWrap.className = 'scopa-deck-stack';
      const backEl = createCardElement(0, { faceDown: true });
      backEl.classList.add('tallone-deck-card');
      deckWrap.appendChild(backEl);

      const countBadge = document.createElement('div');
      countBadge.className = 'tallone-count';
      countBadge.textContent = tr.briscolaUI.cardsInDeck(state.deck.length);
      deckWrap.appendChild(countBadge);
      this.talloneContainer.appendChild(deckWrap);
    } else {
      const emptyBadge = document.createElement('div');
      emptyBadge.className = 'tallone-count';
      emptyBadge.textContent = tr.briscolaUI.deckEmpty;
      this.talloneContainer.appendChild(emptyBadge);
    }

    const myPileInfo = document.createElement('div');
    myPileInfo.className = 'scopa-pile-summary';
    myPileInfo.innerHTML = `
      <div>🃏 ${isIt ? 'Tue Carte' : 'Your Cards'}: <b>${myCapturedCount}</b>/40</div>
      <div>🧹 Scope: <b>${myScopeCount}</b></div>
    `;
    this.talloneContainer.appendChild(myPileInfo);
  }

  showToast(text: string, durationMs: number = 2200) {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden');
    setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, durationMs);
  }
}
