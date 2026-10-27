import type { ScopaMatchState } from '../core/engine/scopa/state';
import { audio } from '../presentation/audio/audio';
import { t } from '../content/i18n';

export interface ScoreCeremonyCallbacks {
  onAdvanceHand: () => void;
  onRematch: () => void;
}

export class ScoreCeremonyModal {
  public el: HTMLElement;
  private contentEl: HTMLElement;
  private callbacks: ScoreCeremonyCallbacks;

  constructor(callbacks: ScoreCeremonyCallbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop hidden';

    this.contentEl = document.createElement('div');
    this.contentEl.className = 'modal-card score-ceremony-card';
    this.el.appendChild(this.contentEl);
  }

  show(state: ScopaMatchState) {
    const res = state.handScoreResult;
    if (!res) return;

    audio.play('fanfare');
    this.el.classList.remove('hidden');

    const tr = t();
    const seats = state.setup.seats;
    const isMatchEnded = state.phase === 'match-ended';
    const numSides = state.setup.config.partnerships ? 2 : seats.length;

    const sideNames = state.setup.config.partnerships
      ? [tr.team1, tr.team2]
      : seats.map((s, idx) =>
          s.kind === 'human' && idx === 0 && seats.filter((x) => x.kind === 'human').length === 1
            ? tr.youPlayer
            : s.name.toLowerCase().includes('computer')
            ? tr.computerN(idx)
            : s.name
        );

    const colsStyle = `grid-template-columns: 1.5fr repeat(${numSides}, 1fr);`;

    let html = `
      <div class="ceremony-header">
        <h2>${isMatchEnded ? tr.matchEndedTitle : tr.handEndedTitle}</h2>
        <p class="hand-num">${tr.handLabel(state.handIndex + 1)}</p>
      </div>
      <div class="score-breakdown-grid" style="${colsStyle}">
        <div class="grid-header">${tr.gameTitle.split(' ')[0]}</div>
        ${sideNames.map((n) => `<div class="grid-header side">${n}</div>`).join('')}

        <div class="row-label">${tr.categories.scope}</div>
        ${res.breakdown.map((b) => `<div class="row-val">${b.scope}</div>`).join('')}

        <div class="row-label">${tr.categories.carte} (${res.cardCounts.join(' vs ')})</div>
        ${res.breakdown.map((b) => `<div class="row-val ${b.carte > 0 ? 'win-point' : ''}">+${b.carte}</div>`).join('')}

        <div class="row-label">${tr.categories.denari} (${res.coinCounts.join(' vs ')})</div>
        ${res.breakdown.map((b) => `<div class="row-val ${b.denari > 0 ? 'win-point' : ''}">+${b.denari}</div>`).join('')}

        <div class="row-label">${tr.categories.setteBello}</div>
        ${res.breakdown.map((b) => `<div class="row-val ${b.setteBello > 0 ? 'win-point' : ''}">+${b.setteBello}</div>`).join('')}

        <div class="row-label">${tr.categories.primiera}</div>
        ${res.breakdown.map((b) => `<div class="row-val ${b.primiera > 0 ? 'win-point' : ''}">+${b.primiera}</div>`).join('')}
    `;

    if (state.setup.config.napola) {
      html += `
        <div class="row-label">${tr.categories.napola}</div>
        ${res.breakdown.map((b) => `<div class="row-val ${b.napola > 0 ? 'win-point' : ''}">+${b.napola}</div>`).join('')}
      `;
    }

    if (state.setup.config.reBello) {
      html += `
        <div class="row-label">${tr.categories.reBello}</div>
        ${res.breakdown.map((b) => `<div class="row-val ${b.reBello > 0 ? 'win-point' : ''}">+${b.reBello}</div>`).join('')}
      `;
    }

    html += `
        <div class="grid-footer">${tr.categories.totalHand}</div>
        ${res.points.map((p) => `<div class="grid-footer side">+${p}</div>`).join('')}

        <div class="grid-footer total">${tr.categories.totalMatch}</div>
        ${state.cumulativeScores.slice(0, numSides).map((tot) => `<div class="grid-footer total side"><b>${tot}</b> pts</div>`).join('')}
      </div>
    `;

    if (isMatchEnded) {
      const winnerName = sideNames[state.winner ?? 0];
      html += `
        <div class="winner-announcement">
          <h3>${tr.winnerTitle(winnerName)}</h3>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" id="btn-rematch">${tr.rematch}</button>
        </div>
      `;
    } else {
      html += `
        <div class="modal-actions">
          <button class="btn-primary" id="btn-next-hand">${tr.nextHand}</button>
        </div>
      `;
    }

    this.contentEl.innerHTML = html;

    const nextHandBtn = this.contentEl.querySelector('#btn-next-hand');
    if (nextHandBtn) {
      nextHandBtn.addEventListener('click', () => {
        this.hide();
        this.callbacks.onAdvanceHand();
      });
    }

    const rematchBtn = this.contentEl.querySelector('#btn-rematch');
    if (rematchBtn) {
      rematchBtn.addEventListener('click', () => {
        this.hide();
        this.callbacks.onRematch();
      });
    }
  }

  hide() {
    this.el.classList.add('hidden');
  }
}
