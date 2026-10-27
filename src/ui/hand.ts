import { cardName, cardNameIt, valueOf, type CardId } from '../core/cards/types';
import type { CaptureOption } from '../core/rules/scopa/capture';
import { createCardElement } from '../presentation/cards';
import { getLang, t } from '../content/i18n';

export interface HandViewCallbacks {
  onSelectCard: (card: CardId | null, hoveredOptionIndex?: number) => void;
  onPlayCard: (card: CardId, captureOptionIndex?: number) => void;
}

export class HandView {
  public el: HTMLElement;
  private cardsContainer: HTMLElement;
  private actionContainer: HTMLElement;
  private selectedCard: CardId | null = null;
  private showHelperBadges: boolean = false;
  private callbacks: HandViewCallbacks;

  constructor(callbacks: HandViewCallbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('footer');
    this.el.className = 'player-tray';

    this.actionContainer = document.createElement('div');
    this.actionContainer.className = 'hand-actions';
    this.el.appendChild(this.actionContainer);

    this.cardsContainer = document.createElement('div');
    this.cardsContainer.className = 'hand-cards';
    this.el.appendChild(this.cardsContainer);
  }

  public setShowHelperBadges(show: boolean) {
    this.showHelperBadges = show;
  }

  public getSelectedCard(): CardId | null {
    return this.selectedCard;
  }

  public setSelectedCard(card: CardId | null) {
    this.selectedCard = card;
  }

  update(
    hand: readonly CardId[],
    isMyTurn: boolean,
    legalOptions: readonly CaptureOption[] = [],
    selectedTableCards: Set<CardId> = new Set()
  ) {
    const tr = t();
    const isIt = getLang() === 'it';
    this.cardsContainer.innerHTML = '';
    this.actionContainer.innerHTML = '';

    const sortedHand = [...hand].sort((a, b) => a - b);

    if (!isMyTurn) {
      this.selectedCard = null;
      const waitMsg = document.createElement('div');
      waitMsg.className = 'wait-turn-indicator';
      waitMsg.textContent = tr.waitingOpponent;
      this.actionContainer.appendChild(waitMsg);

      for (const card of sortedHand) {
        const cardEl = createCardElement(card, {
          selectable: false,
          badgeText: this.showHelperBadges ? `${valueOf(card)}` : undefined,
          badgeClass: this.showHelperBadges ? 'badge-rank-num' : undefined,
        });
        cardEl.classList.add('disabled');
        this.cardsContainer.appendChild(cardEl);
      }
      return;
    }

    // Render playable hand cards
    let cardIdx = 0;
    for (const card of sortedHand) {
      const isSelected = this.selectedCard === card;
      const cardEl = createCardElement(card, {
        selectable: true,
        badgeText: this.showHelperBadges ? `${valueOf(card)}` : undefined,
        badgeClass: this.showHelperBadges ? 'badge-rank-num' : undefined,
        onClick: () => {
          if (this.selectedCard === card) {
            // Second click or double-click on the selected card:
            if (legalOptions.length <= 1) {
              this.selectedCard = null;
              this.callbacks.onSelectCard(null);
              this.callbacks.onPlayCard(card, 0);
            } else {
              // Check if selectedTableCards matches one of the legalOptions
              const matchIdx = legalOptions.findIndex(
                (opt) =>
                  opt.capturedCards.length === selectedTableCards.size &&
                  opt.capturedCards.every((c) => selectedTableCards.has(c))
              );
              if (matchIdx >= 0) {
                this.selectedCard = null;
                this.callbacks.onSelectCard(null);
                this.callbacks.onPlayCard(card, matchIdx);
              } else {
                // Play first capture option on second click if none specified on table
                this.selectedCard = null;
                this.callbacks.onSelectCard(null);
                this.callbacks.onPlayCard(card, 0);
              }
            }
          } else {
            this.selectedCard = card;
            this.callbacks.onSelectCard(card);
          }
        },
      });

      cardEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (legalOptions.length <= 1) {
          this.selectedCard = null;
          this.callbacks.onSelectCard(null);
          this.callbacks.onPlayCard(card, 0);
        }
      });

      cardEl.classList.add('in-attesa-di-te');
      cardEl.style.animationDelay = `${cardIdx * 45}ms`;

      if (isSelected) {
        cardEl.classList.add('selected');
      }
      this.cardsContainer.appendChild(cardEl);
      cardIdx++;
    }

    // Render Action Bar when a card is selected
    if (this.selectedCard !== null) {
      const chosen = this.selectedCard;
      const targetVal = valueOf(chosen);

      if (legalOptions.length > 1) {
        // Multiple capture choices! Show explicit visual buttons for each combination (e.g. "5 + 2 = 7" vs "4 + 3 = 7")
        const choiceContainer = document.createElement('div');
        choiceContainer.className = 'capture-options-tray';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'choice-label';
        titleSpan.textContent = isIt
          ? `Scegli quale presa fare con il ${targetVal}:`
          : `Choose which capture to make with ${targetVal}:`;
        choiceContainer.appendChild(titleSpan);

        const btnsRow = document.createElement('div');
        btnsRow.className = 'capture-options-btns';

        legalOptions.forEach((opt, idx) => {
          const btn = document.createElement('button');
          btn.className = 'btn-capture-combo';

          const sumNums = opt.capturedCards.map((c) => valueOf(c)).join(' + ');
          const namesStr = opt.capturedCards
            .map((c) => (isIt ? cardNameIt(c) : cardName(c)))
            .join(' + ');

          btn.innerHTML = `
            <span class="combo-math">✨ ${sumNums} = ${targetVal}</span>
            <span class="combo-names">${namesStr}</span>
          `;

          btn.addEventListener('mouseenter', () => {
            this.callbacks.onSelectCard(chosen, idx);
          });

          btn.addEventListener('click', () => {
            this.selectedCard = null;
            this.callbacks.onSelectCard(null);
            this.callbacks.onPlayCard(chosen, idx);
          });

          btnsRow.appendChild(btn);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-pill';
        cancelBtn.textContent = `✕ ${tr.cancel}`;
        cancelBtn.addEventListener('click', () => {
          this.selectedCard = null;
          this.callbacks.onSelectCard(null);
        });
        btnsRow.appendChild(cancelBtn);

        choiceContainer.appendChild(btnsRow);
        this.actionContainer.appendChild(choiceContainer);
      } else {
        const playBtn = document.createElement('button');
        playBtn.className = 'btn-play-confirm';
        if (legalOptions.length === 1) {
          const sumNums = legalOptions[0].capturedCards.map((c) => valueOf(c)).join(' + ');
          playBtn.innerHTML = `${tr.playThisCard} (${sumNums} = ${targetVal})`;
        } else {
          playBtn.innerHTML = isIt
            ? `🃏 Cala sul Tavolo (${cardNameIt(chosen)})`
            : `🃏 Place on Table (${cardName(chosen)})`;
        }
        playBtn.addEventListener('click', () => {
          this.selectedCard = null;
          this.callbacks.onSelectCard(null);
          this.callbacks.onPlayCard(chosen, 0);
        });
        this.actionContainer.appendChild(playBtn);
      }
    } else {
      const prompt = document.createElement('div');
      prompt.className = 'turn-prompt';
      prompt.textContent = tr.selectCardPrompt;
      this.actionContainer.appendChild(prompt);
    }
  }

  clearSelection() {
    this.selectedCard = null;
    this.callbacks.onSelectCard(null);
  }
}
