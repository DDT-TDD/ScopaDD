import type { ScopaMatchSetup } from '../core/engine/scopa/state';
import { PRESET_CONFIGS, type ScopaPresetId } from '../core/rules/scopa/config';
import type { BriscolaMatchSetup, BriscolaVariantId } from '../core/engine/briscola/engine';
import {
  TRESSETTE_PRESETS,
  type TressetteMatchSetup,
  type TressetteVariantId,
} from '../core/engine/tressette/engine';
import type { AIDifficulty } from '../ai/policy';
import type { TableAtmosphere } from '../presentation/table3d/table3d';
import { getActiveDeck, type DeckStyle } from '../presentation/cards';
import { audio } from '../presentation/audio/audio';
import { getLang, getPresetTitle, t } from '../content/i18n';
import { randomSeed } from '../core/rng/prng';
import type { ActiveGameMode } from './hud';

export interface SetupWizardCallbacks {
  onStartScopaMatch: (
    setup: ScopaMatchSetup,
    atmosphere: TableAtmosphere,
    deck: DeckStyle
  ) => void;
  onStartBriscolaMatch: (
    setup: BriscolaMatchSetup,
    atmosphere: TableAtmosphere,
    deck: DeckStyle
  ) => void;
  onStartTressetteMatch: (
    setup: TressetteMatchSetup,
    atmosphere: TableAtmosphere,
    deck: DeckStyle
  ) => void;
  onStartSolitario: (atmosphere: TableAtmosphere, deck: DeckStyle) => void;
  onOpenMultiplayer?: (tab: 'lan' | 'online') => void;
}

export class SetupWizardModal {
  public el: HTMLElement;
  private cardEl: HTMLElement;
  private callbacks: SetupWizardCallbacks;
  private selectedGameType: ActiveGameMode = 'scopa';
  private selectedScopaPreset: ScopaPresetId = 'classic';
  private selectedScopaPlayers: 2 | 3 | 4 = 2;
  private selectedBriscolaPreset: BriscolaVariantId = 'classic-2p';
  private selectedTressettePreset: TressetteVariantId = 'classic-2p';
  private selectedTressetteTarget: 11 | 21 | 31 = 21;
  private selectedDifficulty: AIDifficulty = 'standard';
  private selectedPlayMode: 'solo' | 'pass-and-play' | 'lan' | 'online' = 'solo';
  private selectedAtmosphere: TableAtmosphere = 'trattoria';
  private selectedDeck: DeckStyle = 'napoletane';

  constructor(callbacks: SetupWizardCallbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop hidden';

    // Persistent card container so scrollTop is NEVER lost when options change
    this.cardEl = document.createElement('div');
    this.cardEl.className = 'modal-card wizard-card';
    this.el.appendChild(this.cardEl);
  }

  public setAtmosphere(atmosphere: TableAtmosphere) {
    this.selectedAtmosphere = atmosphere;
  }

  public show(initialMode?: ActiveGameMode) {
    if (initialMode) {
      this.selectedGameType = initialMode;
    }
    this.selectedDeck = getActiveDeck();
    this.el.classList.remove('hidden');
    this.render(true);
  }

  public hide() {
    this.el.classList.add('hidden');
  }

  /**
   * Starts a 2-player Pass-and-Play match immediately from the Multiplayer dialog.
   */
  public startPassAndPlayDirectly(mode: ActiveGameMode) {
    this.selectedGameType = mode === 'solitario' ? 'scopa' : mode;
    this.selectedPlayMode = 'pass-and-play';
    this.selectedDeck = getActiveDeck();
    if (this.selectedGameType === 'scopa' && this.selectedScopaPlayers === 3) {
      this.selectedScopaPlayers = 2;
    }
    if (this.selectedGameType === 'briscola' && this.selectedBriscolaPreset === 'teams-4p') {
      this.selectedBriscolaPreset = 'classic-2p';
    }
    if (
      this.selectedGameType === 'tressette' &&
      (this.selectedTressettePreset === 'teams-4p' || this.selectedTressettePreset === 'perdere-4p')
    ) {
      this.selectedTressettePreset = 'classic-2p';
    }
    this.startConfiguredMatch();
  }

  private render(resetScroll: boolean = false) {
    const tr = t();
    const isIt = getLang() === 'it';
    const savedScrollTop = resetScroll ? 0 : this.cardEl.scrollTop;

    // Avoid re-triggering popIn scale keyframe animation on inner setting clicks
    if (!resetScroll) {
      this.cardEl.style.animation = 'none';
    } else {
      this.cardEl.style.animation = '';
    }

    const scopaPresets: { id: ScopaPresetId; badge: string }[] = [
      { id: 'classic', badge: isIt ? '2–4 Giocatori' : '2–4 Players' },
      { id: 'scopone', badge: isIt ? '2 vs 2 (9 carte)' : '2 vs 2 (9 cards)' },
      { id: 'scientifico', badge: isIt ? '2 vs 2 (10 carte)' : '2 vs 2 (10 cards)' },
      { id: 'assi', badge: isIt ? 'Asso = Prende tutto' : 'Ace = Sweeps table' },
      { id: 'quindici', badge: isIt ? 'Somma = 15' : 'Sum = 15' },
      { id: 'napola', badge: isIt ? 'Scala Denari 1-2-3' : 'Coins Run 1-2-3' },
      { id: 'rebello', badge: isIt ? 'Re di Denari +1 pt' : 'King of Coins +1 pt' },
      { id: 'cirulla', badge: isIt ? 'Matta & Accusi' : 'Matta & Bonuses' },
    ];

    const briscolaPresets: { id: BriscolaVariantId; badge: string }[] = [
      { id: 'classic-2p', badge: '1 vs 1' },
      { id: 'teams-4p', badge: '2 vs 2' },
      { id: 'scoperta-2p', badge: isIt ? '👁️ Carte Scoperte' : '👁️ Open Hands' },
      { id: 'fast-31', badge: '⚡ 31 Pt' },
    ];

    const isFixed4PScopa =
      this.selectedScopaPreset === 'scopone' || this.selectedScopaPreset === 'scientifico';
    const effectiveScopaPlayers: 2 | 3 | 4 = isFixed4PScopa ? 4 : this.selectedScopaPlayers;

    this.cardEl.innerHTML = `
      <div class="modal-header-row">
        <h2>${tr.wizard.title}</h2>
        <button class="btn-icon close-wizard-btn" title="${tr.cancel}">✕</button>
      </div>

      <!-- 1. Game Type Selector -->
      <div class="wizard-section">
        <label class="wizard-label">${tr.wizard.selectGame}</label>
        <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
          <button type="button" class="preset-btn ${this.selectedGameType === 'scopa' ? 'selected' : ''}" data-game-type="scopa">
            <span class="preset-name">🧹 ${tr.scopa}</span>
            <span class="preset-badge">${isIt ? '8 Varianti Regionali' : '8 Regional Variants'}</span>
          </button>
          <button type="button" class="preset-btn ${this.selectedGameType === 'briscola' ? 'selected' : ''}" data-game-type="briscola">
            <span class="preset-name">🎺 ${tr.briscola}</span>
            <span class="preset-badge">${isIt ? '4 Modalità di Gioco' : '4 Game Modes'}</span>
          </button>
          <button type="button" class="preset-btn ${this.selectedGameType === 'tressette' ? 'selected' : ''}" data-game-type="tressette">
            <span class="preset-name">👑 ${tr.tressette}</span>
            <span class="preset-badge">${isIt ? 'In Due, In Quattro & Traversone' : '1v1, 2v2 Teams & Traversone'}</span>
          </button>
          <button type="button" class="preset-btn ${this.selectedGameType === 'solitario' ? 'selected' : ''}" data-game-type="solitario">
            <span class="preset-name">🃏 ${tr.solitario}</span>
            <span class="preset-badge">${isIt ? 'Mazzo da 40 Carte' : '40-Card Italian Deck'}</span>
          </button>
        </div>
      </div>

      <!-- 2A. Scopa Variant Selector + Player Count -->
      ${
        this.selectedGameType === 'scopa'
          ? `
      <div class="wizard-section">
        <label class="wizard-label">${tr.wizard.selectVariant}</label>
        <div class="preset-grid">
          ${scopaPresets
            .map((p) => {
              const cfg = PRESET_CONFIGS[p.id];
              const title = getPresetTitle(p.id, cfg.name, cfg.nameIt);
              return `
              <button type="button" class="preset-btn ${
                this.selectedScopaPreset === p.id ? 'selected' : ''
              }" data-scopa-preset="${p.id}">
                <span class="preset-name">${title}</span>
                <span class="preset-badge">${p.badge}</span>
              </button>
            `;
            })
            .join('')}
        </div>
      </div>

      <div class="wizard-section">
        <label class="wizard-label">${
          isIt ? '2b. Numero di Giocatori al Tavolo:' : '2b. Number of Players at Table:'
        }</label>
        <div class="diff-row" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
          <button type="button" class="diff-btn ${effectiveScopaPlayers === 2 ? 'selected' : ''}" ${
              isFixed4PScopa ? 'disabled style="opacity:0.45;cursor:not-allowed;"' : ''
            } data-scopa-players="2">
            👥 ${isIt ? '2 Giocatori (1 vs 1)' : '2 Players (1 vs 1)'}
          </button>
          <button type="button" class="diff-btn ${effectiveScopaPlayers === 3 ? 'selected' : ''}" ${
              isFixed4PScopa ? 'disabled style="opacity:0.45;cursor:not-allowed;"' : ''
            } data-scopa-players="3">
            👨‍👩‍👦 ${isIt ? '3 Giocatori (Tutti vs Tutti)' : '3 Players (1 vs 1 vs 1)'}
          </button>
          <button type="button" class="diff-btn ${effectiveScopaPlayers === 4 ? 'selected' : ''}" data-scopa-players="4">
            👨‍👩‍👧‍👦 ${isIt ? '4 Giocatori (2 vs 2 Squadre)' : '4 Players (2 vs 2 Teams)'}
          </button>
        </div>
      </div>
      `
          : ''
      }

      <!-- 2B. Briscola Variant Selector -->
      ${
        this.selectedGameType === 'briscola'
          ? `
      <div class="wizard-section">
        <label class="wizard-label">${tr.wizard.selectBriscolaVariant}</label>
        <div class="preset-grid">
          ${briscolaPresets
            .map((p) => {
              const info = tr.briscolaPresets[p.id];
              return `
              <button type="button" class="preset-btn ${
                this.selectedBriscolaPreset === p.id ? 'selected' : ''
              }" data-briscola-preset="${p.id}">
                <span class="preset-name">${info.name}</span>
                <span class="preset-badge">${p.badge} — ${info.desc}</span>
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
      `
          : ''
      }

      <!-- 2C. Tressette Variant Selector + Target Points -->
      ${
        this.selectedGameType === 'tressette'
          ? `
      <div class="wizard-section">
        <label class="wizard-label">${
          isIt ? '2. Variante di Tressette:' : '2. Tressette Variant:'
        }</label>
        <div class="preset-grid">
          ${(
            ['classic-2p', 'teams-4p', 'perdere-2p', 'perdere-4p'] as TressetteVariantId[]
          )
            .map((id) => {
              const info = TRESSETTE_PRESETS[id];
              return `
              <button type="button" class="preset-btn ${
                this.selectedTressettePreset === id ? 'selected' : ''
              }" data-tressette-preset="${id}">
                <span class="preset-name">${isIt ? info.nameIt : info.nameEn}</span>
                <span class="preset-badge">${isIt ? info.descIt : info.descEn}</span>
              </button>
            `;
            })
            .join('')}
        </div>
      </div>

      <div class="wizard-section">
        <label class="wizard-label">${
          isIt ? '2b. Punteggio di Vittoria (Target):' : '2b. Target Score to Win:'
        }</label>
        <div class="diff-row" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
          ${([11, 21, 31] as const)
            .map(
              (pts) => `
            <button type="button" class="diff-btn ${
              this.selectedTressetteTarget === pts ? 'selected' : ''
            }" data-tressette-target="${pts}">
              🏆 ${pts} ${isIt ? 'Punti' : 'Points'}${
                pts === 11
                  ? isIt
                    ? ' (Veloce)'
                    : ' (Quick)'
                  : pts === 21
                  ? isIt
                    ? ' (Classico)'
                    : ' (Classic)'
                  : isIt
                  ? ' (Torneo)'
                  : ' (Tournament)'
              }
            </button>
          `
            )
            .join('')}
        </div>
      </div>
      `
          : ''
      }

      <!-- 3. Play Mode (Solo vs Pass-and-Play vs LAN vs Online) -->
      ${
        this.selectedGameType !== 'solitario'
          ? `
      <div class="wizard-section">
        <label class="wizard-label">${tr.wizard.playMode}</label>
        <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
          <button type="button" class="diff-btn ${
            this.selectedPlayMode === 'solo' ? 'selected' : ''
          }" data-play-mode="solo">
            ${tr.wizard.vsComputer}
          </button>
          <button type="button" class="diff-btn ${
            this.selectedPlayMode === 'pass-and-play' ? 'selected' : ''
          }" data-play-mode="pass-and-play">
            ${tr.wizard.passAndPlay}
          </button>
          <button type="button" class="diff-btn ${
            this.selectedPlayMode === 'lan' ? 'selected' : ''
          }" data-play-mode="lan">
            🏠 ${isIt ? 'In Casa su Wi-Fi (LAN)' : 'Home Wi-Fi (Local LAN)'}
          </button>
          <button type="button" class="diff-btn ${
            this.selectedPlayMode === 'online' ? 'selected' : ''
          }" data-play-mode="online">
            🌍 ${isIt ? 'Gioca Online (A Distanza P2P)' : 'Play Online (Remote P2P)'}
          </button>
        </div>
      </div>
      `
          : ''
      }

      <!-- 4. Regional Deck Style -->
      <div class="wizard-section">
        <label class="wizard-label">${tr.wizard.selectDeck}</label>
        <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr);">
          ${(
            [
              'napoletane',
              'piacentine',
              'bresciane',
              'romagnole',
              'trevisane',
              'bergamasche',
              'triestine',
              'moderne',
            ] as DeckStyle[]
          )
            .map(
              (d) => `
            <button type="button" class="preset-btn ${
              this.selectedDeck === d ? 'selected' : ''
            }" data-deck="${d}">
              <span class="preset-name">🎴 ${tr.deckStyles[d]}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- 5. AI Difficulty -->
      ${
        this.selectedGameType !== 'solitario' && this.selectedPlayMode === 'solo'
          ? `
      <div class="wizard-section">
        <label class="wizard-label">${tr.wizard.aiDifficulty}</label>
        <div class="diff-row">
          <button type="button" class="diff-btn ${
            this.selectedDifficulty === 'relaxed' ? 'selected' : ''
          }" data-diff="relaxed">
            ${tr.wizard.relaxed}
          </button>
          <button type="button" class="diff-btn ${
            this.selectedDifficulty === 'standard' ? 'selected' : ''
          }" data-diff="standard">
            ${tr.wizard.standard}
          </button>
          <button type="button" class="diff-btn ${
            this.selectedDifficulty === 'expert' ? 'selected' : ''
          }" data-diff="expert">
            ${tr.wizard.expert}
          </button>
        </div>
      </div>
      `
          : ''
      }

      <!-- 6. Table Theme (Including Halloween, Xmas, Kids Wonderland) -->
      <div class="wizard-section">
        <label class="wizard-label">${tr.wizard.atmosphere}</label>
        <div class="preset-grid" style="grid-template-columns: repeat(3, 1fr);">
          ${(
            [
              'trattoria',
              'salotto',
              'piazza',
              'notte',
              'halloween',
              'xmas',
              'bimbi',
            ] as TableAtmosphere[]
          )
            .map(
              (atmo) => `
            <button type="button" class="diff-btn ${
              this.selectedAtmosphere === atmo ? 'selected' : ''
            }" data-atmo="${atmo}">
              ${tr.wizard[atmo]}
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn-secondary cancel-wizard-btn">${tr.cancel}</button>
        <button type="button" class="btn-primary start-wizard-btn">${
          this.selectedPlayMode === 'lan'
            ? isIt
              ? '🏠 Apri Tavolo Wi-Fi / LAN ➡️'
              : '🏠 Open Home Wi-Fi / LAN ➡️'
            : this.selectedPlayMode === 'online'
            ? isIt
              ? '🌍 Apri Connessione Online ➡️'
              : '🌍 Open Online Lobby ➡️'
            : tr.wizard.startGame
        }</button>
      </div>
    `;

    // Restore exact scroll position immediately so clicking any setting never jumps to top!
    this.cardEl.scrollTop = savedScrollTop;

    // Bind events
    this.cardEl.querySelectorAll('[data-game-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedGameType = (btn as HTMLElement).dataset.gameType as ActiveGameMode;
        audio.play('click');
        this.render(false);
      });
    });

    this.cardEl.querySelectorAll('[data-scopa-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedScopaPreset = (btn as HTMLElement).dataset.scopaPreset as ScopaPresetId;
        if (this.selectedScopaPreset === 'scopone' || this.selectedScopaPreset === 'scientifico') {
          this.selectedScopaPlayers = 4;
        }
        audio.play('click');
        this.render(false);
      });
    });

    this.cardEl.querySelectorAll('[data-scopa-players]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const count = Number((btn as HTMLElement).dataset.scopaPlayers) as 2 | 3 | 4;
        if (count === 2 || count === 3 || count === 4) {
          this.selectedScopaPlayers = count;
          audio.play('click');
          this.render(false);
        }
      });
    });

    this.cardEl.querySelectorAll('[data-briscola-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedBriscolaPreset = (btn as HTMLElement).dataset
          .briscolaPreset as BriscolaVariantId;
        audio.play('click');
        this.render(false);
      });
    });

    this.cardEl.querySelectorAll('[data-tressette-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedTressettePreset = (btn as HTMLElement).dataset
          .tressettePreset as TressetteVariantId;
        audio.play('click');
        this.render(false);
      });
    });

    this.cardEl.querySelectorAll('[data-tressette-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pts = Number((btn as HTMLElement).dataset.tressetteTarget) as 11 | 21 | 31;
        if (pts === 11 || pts === 21 || pts === 31) {
          this.selectedTressetteTarget = pts;
          audio.play('click');
          this.render(false);
        }
      });
    });

    this.cardEl.querySelectorAll('[data-play-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedPlayMode = (btn as HTMLElement).dataset.playMode as
          | 'solo'
          | 'pass-and-play'
          | 'lan'
          | 'online';
        audio.play('click');
        this.render(false);
      });
    });

    this.cardEl.querySelectorAll('[data-deck]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedDeck = (btn as HTMLElement).dataset.deck as DeckStyle;
        audio.play('click');
        this.render(false);
      });
    });

    this.cardEl.querySelectorAll('[data-diff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedDifficulty = (btn as HTMLElement).dataset.diff as AIDifficulty;
        audio.play('click');
        this.render(false);
      });
    });

    this.cardEl.querySelectorAll('[data-atmo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedAtmosphere = (btn as HTMLElement).dataset.atmo as TableAtmosphere;
        audio.play('click');
        this.render(false);
      });
    });

    this.cardEl.querySelector('.close-wizard-btn')?.addEventListener('click', () => {
      audio.play('click');
      this.hide();
    });

    this.cardEl.querySelector('.cancel-wizard-btn')?.addEventListener('click', () => {
      audio.play('click');
      this.hide();
    });

    this.cardEl.querySelector('.start-wizard-btn')?.addEventListener('click', () => {
      audio.play('click');
      this.startConfiguredMatch();
    });
  }

  private startConfiguredMatch() {
    const tr = t();
    const isIt = getLang() === 'it';

    if (this.selectedGameType === 'solitario') {
      this.hide();
      this.callbacks.onStartSolitario(this.selectedAtmosphere, this.selectedDeck);
      return;
    }

    const isHumanVsHuman =
      this.selectedPlayMode === 'pass-and-play' ||
      this.selectedPlayMode === 'lan' ||
      this.selectedPlayMode === 'online';

    if (this.selectedGameType === 'briscola') {
      const is4P = this.selectedBriscolaPreset === 'teams-4p' && !isHumanVsHuman;
      const openHands = this.selectedBriscolaPreset === 'scoperta-2p';
      const targetPoints = this.selectedBriscolaPreset === 'fast-31' ? 31 : 61;

      const seats: BriscolaMatchSetup['seats'] = isHumanVsHuman
        ? [
            { kind: 'human', name: isIt ? 'Giocatore 1' : 'Player 1', avatar: 'nonno' },
            { kind: 'human', name: isIt ? 'Giocatore 2' : 'Player 2', avatar: 'volpe' },
          ]
        : is4P
        ? [
            { kind: 'human', name: tr.youPlayer, avatar: 'nonno' },
            {
              kind: 'ai',
              name: tr.computerN(1),
              avatar: 'wolf',
              aiDifficulty: this.selectedDifficulty,
            },
            {
              kind: 'ai',
              name: tr.partnerPlayer,
              avatar: 'nonna',
              aiDifficulty: this.selectedDifficulty,
            },
            {
              kind: 'ai',
              name: tr.computerN(2),
              avatar: 'barista',
              aiDifficulty: this.selectedDifficulty,
            },
          ]
        : [
            { kind: 'human', name: tr.youPlayer, avatar: 'nonno' },
            {
              kind: 'ai',
              name: tr.computer,
              avatar: 'wolf',
              aiDifficulty: this.selectedDifficulty,
            },
          ];

      const setup: BriscolaMatchSetup = {
        presetId: this.selectedBriscolaPreset,
        playerCount: is4P ? 4 : 2,
        partnerships: is4P,
        openHands,
        targetPoints,
        seats,
        seed: randomSeed(),
      };

      this.hide();
      this.callbacks.onStartBriscolaMatch(setup, this.selectedAtmosphere, this.selectedDeck);

      if (this.selectedPlayMode === 'lan' || this.selectedPlayMode === 'online') {
        this.callbacks.onOpenMultiplayer?.(this.selectedPlayMode);
      }
      return;
    }

    if (this.selectedGameType === 'tressette') {
      const effectiveVariant: TressetteVariantId = isHumanVsHuman
        ? this.selectedTressettePreset === 'perdere-4p' ||
          this.selectedTressettePreset === 'perdere-2p'
          ? 'perdere-2p'
          : 'classic-2p'
        : this.selectedTressettePreset;
      const is4P =
        (effectiveVariant === 'teams-4p' || effectiveVariant === 'perdere-4p') && !isHumanVsHuman;

      const seats: TressetteMatchSetup['seats'] = isHumanVsHuman
        ? [
            { kind: 'human', name: isIt ? 'Giocatore 1' : 'Player 1', avatar: '🧑‍🌾' },
            { kind: 'human', name: isIt ? 'Giocatore 2' : 'Player 2', avatar: '🦊' },
          ]
        : is4P
        ? [
            { kind: 'human', name: tr.youPlayer, avatar: '🧑‍🌾' },
            {
              kind: 'ai',
              name: 'Gennaro',
              avatar: '🦊',
              aiDifficulty: this.selectedDifficulty,
            },
            {
              kind: 'ai',
              name: 'Carmela',
              avatar: '👵',
              aiDifficulty: this.selectedDifficulty,
            },
            {
              kind: 'ai',
              name: 'Valerio',
              avatar: '🐺',
              aiDifficulty: this.selectedDifficulty,
            },
          ]
        : [
            { kind: 'human', name: tr.youPlayer, avatar: '🧑‍🌾' },
            {
              kind: 'ai',
              name: 'Franco',
              avatar: '🤖',
              aiDifficulty: this.selectedDifficulty,
            },
          ];

      const setup: TressetteMatchSetup = {
        variant: effectiveVariant,
        presetId: effectiveVariant,
        targetPoints: this.selectedTressetteTarget,
        seats,
        seed: randomSeed(),
      };

      this.hide();
      this.callbacks.onStartTressetteMatch(setup, this.selectedAtmosphere, this.selectedDeck);

      if (this.selectedPlayMode === 'lan' || this.selectedPlayMode === 'online') {
        this.callbacks.onOpenMultiplayer?.(this.selectedPlayMode);
      }
      return;
    }

    // Scopa Match Setup
    const baseConfig = PRESET_CONFIGS[this.selectedScopaPreset];
    const isFixed4P =
      this.selectedScopaPreset === 'scopone' || this.selectedScopaPreset === 'scientifico';
    const desiredCount: 2 | 3 | 4 =
      this.selectedPlayMode === 'lan' || this.selectedPlayMode === 'online'
        ? 2
        : isFixed4P
        ? 4
        : this.selectedScopaPlayers;

    const finalConfig = {
      ...baseConfig,
      playerCount: desiredCount,
      partnerships: desiredCount === 4,
      initialHandCards: isFixed4P ? baseConfig.initialHandCards : 3,
      initialTableCards: isFixed4P ? baseConfig.initialTableCards : 4,
    };

    const seats: ScopaMatchSetup['seats'] =
      this.selectedPlayMode === 'pass-and-play' ||
      this.selectedPlayMode === 'lan' ||
      this.selectedPlayMode === 'online'
        ? Array.from({ length: desiredCount }, (_, idx) => ({
            kind: 'human' as const,
            name: isIt ? `Giocatore ${idx + 1}` : `Player ${idx + 1}`,
            avatar: ['nonno', 'volpe', 'nonna', 'barista'][idx] || 'nonno',
          }))
        : desiredCount === 4
        ? [
            { kind: 'human', name: tr.youPlayer, avatar: 'nonno' },
            {
              kind: 'ai',
              name: tr.computerN(1),
              avatar: 'wolf',
              aiDifficulty: this.selectedDifficulty,
            },
            {
              kind: 'ai',
              name: tr.partnerPlayer,
              avatar: 'nonna',
              aiDifficulty: this.selectedDifficulty,
            },
            {
              kind: 'ai',
              name: tr.computerN(2),
              avatar: 'barista',
              aiDifficulty: this.selectedDifficulty,
            },
          ]
        : desiredCount === 3
        ? [
            { kind: 'human', name: tr.youPlayer, avatar: 'nonno' },
            {
              kind: 'ai',
              name: tr.computerN(1),
              avatar: 'wolf',
              aiDifficulty: this.selectedDifficulty,
            },
            {
              kind: 'ai',
              name: tr.computerN(2),
              avatar: 'volpe',
              aiDifficulty: this.selectedDifficulty,
            },
          ]
        : [
            { kind: 'human', name: tr.youPlayer, avatar: 'nonno' },
            {
              kind: 'ai',
              name: tr.computer,
              avatar: 'wolf',
              aiDifficulty: this.selectedDifficulty,
            },
          ];

    const setup: ScopaMatchSetup = {
      config: finalConfig,
      seats,
      seed: randomSeed(),
    };

    this.hide();
    this.callbacks.onStartScopaMatch(setup, this.selectedAtmosphere, this.selectedDeck);

    if (this.selectedPlayMode === 'lan' || this.selectedPlayMode === 'online') {
      this.callbacks.onOpenMultiplayer?.(this.selectedPlayMode);
    }
  }
}
