import { valueOf, type CardId } from '../core/cards/types';
import {
  autoMove,
  createSolitaireGame,
  drawStock,
  moveTableauToFoundation,
  moveTableauToTableau,
  moveWasteToFoundation,
  moveWasteToTableau,
} from '../core/engine/solitario/engine';
import type { SolitaireState } from '../core/rules/solitario/types';
import { audio } from '../presentation/audio/audio';
import { createCardElement } from '../presentation/cards';
import { getLanguage, t } from '../content/i18n';

export interface SolitarioViewCallbacks {
  onBackToScopa: () => void;
}

export class SolitarioView {
  public el: HTMLElement;
  private state: SolitaireState;
  private history: SolitaireState[] = [];
  private callbacks: SolitarioViewCallbacks;
  private showHelperBadges: boolean = false;
  private selectedSource:
    | { type: 'waste'; card: CardId }
    | { type: 'tableau'; col: number; idx: number; card: CardId }
    | null = null;

  // DOM elements
  private headerEl: HTMLElement;
  private topRowEl: HTMLElement;
  private tableauEl: HTMLElement;
  private toastEl: HTMLElement;
  private movesBadge: HTMLElement;
  private undoBtn: HTMLButtonElement;
  private autoBtn: HTMLButtonElement;

  constructor(callbacks: SolitarioViewCallbacks) {
    this.callbacks = callbacks;
    this.state = createSolitaireGame();

    this.el = document.createElement('div');
    this.el.className = 'solitario-screen game-table-view atmo-trattoria';

    // Header bar
    this.headerEl = document.createElement('header');
    this.headerEl.className = 'solitario-header';

    const leftGroup = document.createElement('div');
    leftGroup.className = 'sol-btn-group';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-icon btn-back-scopa';
    backBtn.innerHTML = `⬅️ <span>${t().backToScopa}</span>`;
    backBtn.addEventListener('click', () => this.callbacks.onBackToScopa());
    leftGroup.appendChild(backBtn);

    const restartBtn = document.createElement('button');
    restartBtn.className = 'btn-icon btn-restart-sol';
    restartBtn.innerHTML = `🔄 <span>${t().restart}</span>`;
    restartBtn.addEventListener('click', () => {
      this.state = createSolitaireGame();
      this.history = [];
      this.selectedSource = null;
      audio.play('shuffle');
      this.render();
    });
    leftGroup.appendChild(restartBtn);

    this.undoBtn = document.createElement('button');
    this.undoBtn.className = 'btn-icon btn-undo-sol';
    this.undoBtn.innerHTML = `↩️ <span>${getLanguage() === 'it' ? 'Annulla' : 'Undo'}</span>`;
    this.undoBtn.addEventListener('click', () => {
      if (this.history.length > 0) {
        this.state = this.history.pop()!;
        this.selectedSource = null;
        audio.play('click');
        this.render();
      }
    });
    leftGroup.appendChild(this.undoBtn);

    this.autoBtn = document.createElement('button');
    this.autoBtn.className = 'btn-icon btn-auto-sol';
    this.autoBtn.innerHTML = `⚡ <span>${getLanguage() === 'it' ? 'Mossa Auto' : 'Auto Move'}</span>`;
    this.autoBtn.addEventListener('click', () => {
      this.trySmartAutoMove();
    });
    leftGroup.appendChild(this.autoBtn);

    this.movesBadge = document.createElement('div');
    this.movesBadge.className = 'score-pill';
    this.movesBadge.innerHTML = `${t().moves}: <b>0</b>`;

    this.headerEl.appendChild(leftGroup);
    this.headerEl.appendChild(this.movesBadge);
    this.el.appendChild(this.headerEl);

    // Main layout
    this.topRowEl = document.createElement('div');
    this.topRowEl.className = 'solitario-top-row';
    this.el.appendChild(this.topRowEl);

    this.tableauEl = document.createElement('div');
    this.tableauEl.className = 'solitario-tableau';
    this.el.appendChild(this.tableauEl);

    // Toast
    this.toastEl = document.createElement('div');
    this.toastEl.className = 'scopa-toast hidden';
    this.el.appendChild(this.toastEl);

    audio.play('deal');
    this.render();
  }

  private cloneState(s: SolitaireState): SolitaireState {
    return {
      ...s,
      foundations: s.foundations.map((f) => [...f]),
      tableau: s.tableau.map((col) => [...col]),
      stock: [...s.stock],
      waste: [...s.waste],
    };
  }

  private commitState(next: SolitaireState) {
    this.history.push(this.cloneState(this.state));
    if (this.history.length > 60) {
      this.history.shift();
    }
    this.state = next;
  }

  public setShowHelperBadges(show: boolean) {
    this.showHelperBadges = show;
    this.render();
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

  public render() {
    const tr = t();
    const isIt = getLanguage() === 'it';

    // Update Header labels
    const backBtn = this.headerEl.querySelector('.btn-back-scopa span');
    if (backBtn) backBtn.textContent = tr.backToScopa;

    const restartBtn = this.headerEl.querySelector('.btn-restart-sol span');
    if (restartBtn) restartBtn.textContent = tr.restart;

    const undoSpan = this.undoBtn.querySelector('span');
    if (undoSpan) undoSpan.textContent = isIt ? 'Annulla' : 'Undo';
    this.undoBtn.disabled = this.history.length === 0;
    this.undoBtn.style.opacity = this.history.length === 0 ? '0.45' : '1';

    const autoSpan = this.autoBtn.querySelector('span');
    if (autoSpan) autoSpan.textContent = isIt ? 'Mossa Auto' : 'Auto Move';

    const fndTotal = this.state.foundations.reduce((sum, f) => sum + f.length, 0);
    this.movesBadge.innerHTML = `${tr.moves}: <b>${this.state.moves}</b> | 🏛️ <b>${fndTotal}/40</b> (${tr.passes}: ${this.state.stockPasses})`;

    // 1. Render Top Row (Stock, Waste, Foundations)
    this.topRowEl.innerHTML = '';

    const stockWasteGroup = document.createElement('div');
    stockWasteGroup.className = 'stock-waste-group';

    // Stock pile
    const stockEl = document.createElement('div');
    stockEl.className = 'pile stock-pile';
    if (this.state.stock.length > 0) {
      const topBack = createCardElement(this.state.stock[0], {
        faceDown: true,
        selectable: true,
        lang: getLanguage(),
        onClick: () => {
          this.selectedSource = null;
          this.commitState(drawStock(this.state));
          audio.play('play');
          this.render();
        },
      });
      stockEl.appendChild(topBack);
    } else {
      const emptyStock = document.createElement('div');
      emptyStock.className = 'empty-slot';
      emptyStock.title = isIt ? 'Rimescola scarti nel tallone' : 'Recycle waste into stock';
      emptyStock.textContent = this.state.waste.length > 0 ? '🔄' : '∅';
      emptyStock.addEventListener('click', () => {
        if (this.state.waste.length > 0) {
          this.selectedSource = null;
          this.commitState(drawStock(this.state));
          audio.play('shuffle');
          this.render();
        }
      });
      stockEl.appendChild(emptyStock);
    }
    const stockCountBadge = document.createElement('div');
    stockCountBadge.className = 'pile-count-badge';
    stockCountBadge.textContent = `🃏 ${this.state.stock.length}`;
    stockEl.appendChild(stockCountBadge);
    stockWasteGroup.appendChild(stockEl);

    // Waste pile
    const wasteEl = document.createElement('div');
    wasteEl.className = 'pile waste-pile';
    if (this.state.waste.length > 0) {
      const topWaste = this.state.waste[this.state.waste.length - 1];
      const isWasteSelected =
        this.selectedSource?.type === 'waste' && this.selectedSource.card === topWaste;
      const cardEl = createCardElement(topWaste, {
        selectable: true,
        lang: getLanguage(),
        badgeText: this.showHelperBadges ? `${valueOf(topWaste)}` : undefined,
        badgeClass: this.showHelperBadges ? 'badge-rank-num' : undefined,
        onClick: () => {
          this.handleWasteClick(topWaste);
        },
      });
      cardEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.handleAutoMoveCard(topWaste);
      });
      if (isWasteSelected) {
        cardEl.classList.add('selected');
      }
      wasteEl.appendChild(cardEl);
    } else {
      const emptyWaste = document.createElement('div');
      emptyWaste.className = 'empty-slot';
      wasteEl.appendChild(emptyWaste);
    }
    const wasteCountBadge = document.createElement('div');
    wasteCountBadge.className = 'pile-count-badge';
    wasteCountBadge.textContent = `${isIt ? 'Scarti' : 'Waste'}: ${this.state.waste.length}`;
    wasteEl.appendChild(wasteCountBadge);
    stockWasteGroup.appendChild(wasteEl);
    this.topRowEl.appendChild(stockWasteGroup);

    // Foundations (4 Suits: Denari, Coppe, Spade, Bastoni)
    const fndGroup = document.createElement('div');
    fndGroup.className = 'foundations-group';
    const suitIcons = ['🪙', '🍷', '⚔️', '🪵'];
    const suitLabelsIt = ['Denari', 'Coppe', 'Spade', 'Bastoni'];
    const suitLabelsEn = ['Coins', 'Cups', 'Swords', 'Clubs'];

    for (let s = 0; s < 4; s++) {
      const fndEl = document.createElement('div');
      fndEl.className = 'pile foundation-pile';
      const fCards = this.state.foundations[s];
      if (fCards.length > 0) {
        const topCard = fCards[fCards.length - 1];
        const cardEl = createCardElement(topCard, {
          selectable: true,
          lang: getLanguage(),
          badgeText: this.showHelperBadges ? `${valueOf(topCard)}` : undefined,
          badgeClass: this.showHelperBadges ? 'badge-rank-num' : undefined,
          onClick: () => this.handleFoundationClick(s),
        });
        fndEl.appendChild(cardEl);
      } else {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'empty-slot fnd-slot';
        emptySlot.textContent = suitIcons[s];
        emptySlot.addEventListener('click', () => this.handleFoundationClick(s));
        fndEl.appendChild(emptySlot);
      }
      const fndBadge = document.createElement('div');
      fndBadge.className = 'pile-count-badge';
      fndBadge.textContent = `${suitIcons[s]} ${isIt ? suitLabelsIt[s] : suitLabelsEn[s]} (${fCards.length}/10)`;
      fndEl.appendChild(fndBadge);
      fndGroup.appendChild(fndEl);
    }
    this.topRowEl.appendChild(fndGroup);

    // 2. Render Tableau (4 Columns)
    this.tableauEl.innerHTML = '';
    for (let c = 0; c < 4; c++) {
      const colEl = document.createElement('div');
      colEl.className = 'tableau-column';
      const colCards = this.state.tableau[c];

      // Responsive vertical overlap so tall columns remain compact & easy to read
      const overlapPx = colCards.length > 8 ? -96 : colCards.length > 5 ? -90 : -82;

      if (colCards.length === 0) {
        const emptyColSlot = document.createElement('div');
        emptyColSlot.className = 'empty-slot';
        emptyColSlot.innerHTML = `<span class="empty-slot-msg">${tr.emptyTable}</span>`;
        emptyColSlot.addEventListener('click', () => this.handleEmptyColumnClick(c));
        colEl.appendChild(emptyColSlot);
      } else {
        for (let idx = 0; idx < colCards.length; idx++) {
          const card = colCards[idx];
          const isSelected =
            this.selectedSource?.type === 'tableau' &&
            this.selectedSource.col === c &&
            idx >= this.selectedSource.idx;
          const cardEl = createCardElement(card, {
            selectable: true,
            lang: getLanguage(),
            badgeText: this.showHelperBadges ? `${valueOf(card)}` : undefined,
            badgeClass: this.showHelperBadges ? 'badge-rank-num' : undefined,
            onClick: () => {
              this.handleTableauCardClick(c, idx, card);
            },
          });
          cardEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.handleAutoMoveCard(card);
          });
          if (isSelected) {
            cardEl.classList.add('selected');
          }
          cardEl.style.marginTop = idx === 0 ? '0' : `${overlapPx}px`;
          colEl.appendChild(cardEl);
        }
      }
      this.tableauEl.appendChild(colEl);
    }

    // Check Victory
    if (this.state.isWon) {
      audio.play('fanfare');
      this.toastEl.textContent = `🏆 ${tr.congratulations} ${tr.solitaireWon} 🏆`;
      this.toastEl.classList.remove('hidden');
    } else {
      this.toastEl.classList.add('hidden');
    }
  }

  /**
   * Single click on Waste card selects it; second click (or double click) auto-moves it.
   * This prevents cards like the 2 of Denari from vanishing on first click before the player chooses a destination.
   */
  private handleWasteClick(card: CardId) {
    if (this.selectedSource?.type === 'waste' && this.selectedSource.card === card) {
      // Second click on already-selected waste card -> auto-move
      this.selectedSource = null;
      this.handleAutoMoveCard(card);
      return;
    }
    this.selectedSource = { type: 'waste', card };
    audio.play('click');
    this.render();
  }

  /**
   * Single click on a Tableau card:
   * - If another card/pile is already selected, tries moving the selected card/pile onto this column.
   * - If the same card was already selected, triggers autoMove (to foundation or valid column).
   * - Otherwise selects this card/sub-pile so the player can choose where to place it.
   */
  private handleTableauCardClick(col: number, idx: number, card: CardId) {
    if (this.selectedSource) {
      if (this.selectedSource.type === 'waste') {
        const next = moveWasteToTableau(this.state, col);
        if (next) {
          this.selectedSource = null;
          audio.play('play');
          this.commitState(next);
          this.render();
          return;
        }
      } else if (this.selectedSource.type === 'tableau') {
        if (this.selectedSource.col === col && this.selectedSource.idx === idx) {
          // Clicked same card a second time -> try autoMove
          this.selectedSource = null;
          this.handleAutoMoveCard(card);
          return;
        }
        const next = moveTableauToTableau(
          this.state,
          this.selectedSource.col,
          this.selectedSource.idx,
          col
        );
        if (next) {
          this.selectedSource = null;
          audio.play('play');
          this.commitState(next);
          this.render();
          return;
        }
      }
    }

    // Select this card / sequence
    this.selectedSource = { type: 'tableau', col, idx, card };
    audio.play('click');
    this.render();
  }

  private handleFoundationClick(_suitIdx: number) {
    if (!this.selectedSource) return;
    if (this.selectedSource.type === 'waste') {
      const next = moveWasteToFoundation(this.state);
      if (next) {
        this.selectedSource = null;
        audio.play('play');
        this.commitState(next);
        this.render();
      }
    } else if (this.selectedSource.type === 'tableau') {
      const next = moveTableauToFoundation(this.state, this.selectedSource.col);
      if (next) {
        this.selectedSource = null;
        audio.play('play');
        this.commitState(next);
        this.render();
      }
    }
  }

  private handleEmptyColumnClick(col: number) {
    if (!this.selectedSource) return;
    if (this.selectedSource.type === 'waste') {
      const next = moveWasteToTableau(this.state, col);
      if (next) {
        this.selectedSource = null;
        audio.play('play');
        this.commitState(next);
        this.render();
      }
    } else if (this.selectedSource.type === 'tableau') {
      const next = moveTableauToTableau(
        this.state,
        this.selectedSource.col,
        this.selectedSource.idx,
        col
      );
      if (next) {
        this.selectedSource = null;
        audio.play('play');
        this.commitState(next);
        this.render();
      }
    }
  }

  private handleAutoMoveCard(card: CardId) {
    const next = autoMove(this.state, card);
    if (next) {
      this.selectedSource = null;
      audio.play('play');
      this.commitState(next);
      this.render();
    } else {
      audio.play('click');
    }
  }

  private trySmartAutoMove() {
    if (this.selectedSource) {
      this.handleAutoMoveCard(this.selectedSource.card);
      return;
    }
    // Try moving top of waste to foundation first
    if (this.state.waste.length > 0) {
      const next = moveWasteToFoundation(this.state);
      if (next) {
        audio.play('play');
        this.commitState(next);
        this.render();
        return;
      }
    }
    // Try moving any tableau top card to foundation
    for (let c = 0; c < 4; c++) {
      const next = moveTableauToFoundation(this.state, c);
      if (next) {
        audio.play('play');
        this.commitState(next);
        this.render();
        return;
      }
    }
    // Try autoMove on top waste card
    if (this.state.waste.length > 0) {
      const topWaste = this.state.waste[this.state.waste.length - 1];
      const next = autoMove(this.state, topWaste);
      if (next) {
        audio.play('play');
        this.commitState(next);
        this.render();
        return;
      }
    }
    audio.play('click');
  }
}
