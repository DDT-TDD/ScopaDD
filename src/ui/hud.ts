import type { ScopaMatchState } from '../core/engine/scopa/state';
import type { BriscolaMatchState } from '../core/engine/briscola/engine';
import type { TressetteMatchState } from '../core/engine/tressette/engine';
import { formatTerzi } from '../core/rules/tressette/types';
import { getAvatar } from '../safety/avatars';
import { getLang, setLang, t } from '../content/i18n';
import { getActiveDeck, setActiveDeck, type DeckStyle } from '../presentation/cards';
import type { TableAtmosphere } from '../presentation/table3d/table3d';

export type ActiveGameMode = 'scopa' | 'briscola' | 'tressette' | 'solitario';

export interface HUDCallbacks {
  onSelectMode: (mode: ActiveGameMode) => void;
  onNewGame: () => void;
  onOpenMultiplayer: () => void;
  onOpenCredits: () => void;
  onToggleSimpleMode: () => void;
  onLanguageChange: () => void;
  onDeckChange: (deck: DeckStyle) => void;
  onAtmosphereChange: (atmo: TableAtmosphere) => void;
}

export class HUD {
  public el: HTMLElement;
  private simpleModeBtn!: HTMLButtonElement;
  private langBtn!: HTMLButtonElement;
  private scoreEl!: HTMLElement;
  private turnEl!: HTMLElement;
  private isSimpleMode: boolean = false;
  private activeMode: ActiveGameMode = 'scopa';
  private activeAtmosphere: TableAtmosphere = 'trattoria';
  private callbacks: HUDCallbacks;
  private lastScopaState: ScopaMatchState | null = null;
  private lastBriscolaState: BriscolaMatchState | null = null;
  private lastTressetteState: TressetteMatchState | null = null;

  constructor(callbacks: HUDCallbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('header');
    this.el.className = 'app-hud';
    this.render();
  }

  public setMode(mode: ActiveGameMode) {
    this.activeMode = mode;
    this.render();
  }

  public setAtmosphere(atmo: TableAtmosphere) {
    this.activeAtmosphere = atmo;
    this.render();
  }

  public render() {
    this.el.innerHTML = '';
    const tr = t();

    // Left: Clear Game Switcher (Scopa | Briscola | Solitario) + New Game
    const leftGroup = document.createElement('div');
    leftGroup.className = 'hud-group left';

    const modeTabs = document.createElement('div');
    modeTabs.className = 'hud-mode-tabs';

    const scopaTab = document.createElement('button');
    scopaTab.className = `hud-mode-btn ${this.activeMode === 'scopa' ? 'active' : ''}`;
    scopaTab.innerHTML = `🧹 <span>${tr.scopaMode}</span>`;
    scopaTab.addEventListener('click', () => this.callbacks.onSelectMode('scopa'));
    modeTabs.appendChild(scopaTab);

    const briscolaTab = document.createElement('button');
    briscolaTab.className = `hud-mode-btn ${this.activeMode === 'briscola' ? 'active' : ''}`;
    briscolaTab.innerHTML = `🎺 <span>${tr.briscolaMode}</span>`;
    briscolaTab.addEventListener('click', () => this.callbacks.onSelectMode('briscola'));
    modeTabs.appendChild(briscolaTab);

    const tressetteTab = document.createElement('button');
    tressetteTab.className = `hud-mode-btn ${this.activeMode === 'tressette' ? 'active' : ''}`;
    tressetteTab.innerHTML = `👑 <span>${tr.tressetteMode}</span>`;
    tressetteTab.addEventListener('click', () => this.callbacks.onSelectMode('tressette'));
    modeTabs.appendChild(tressetteTab);

    const solTab = document.createElement('button');
    solTab.className = `hud-mode-btn ${this.activeMode === 'solitario' ? 'active' : ''}`;
    solTab.innerHTML = `🎴 <span>${tr.solitario}</span>`;
    solTab.addEventListener('click', () => this.callbacks.onSelectMode('solitario'));
    modeTabs.appendChild(solTab);

    leftGroup.appendChild(modeTabs);

    const newGameBtn = document.createElement('button');
    newGameBtn.className = 'btn-icon btn-new-match';
    newGameBtn.innerHTML = `⚙️ <span>${tr.newGame}</span>`;
    newGameBtn.title = tr.newGame;
    newGameBtn.addEventListener('click', this.callbacks.onNewGame);
    leftGroup.appendChild(newGameBtn);

    // Center: Scores & Turn
    const centerGroup = document.createElement('div');
    centerGroup.className = 'hud-group center';

    this.scoreEl = document.createElement('div');
    this.scoreEl.className = 'score-pill';
    centerGroup.appendChild(this.scoreEl);

    this.turnEl = document.createElement('div');
    this.turnEl.className = 'turn-pill';
    centerGroup.appendChild(this.turnEl);

    // Right: Multiplayer, Deck, Table Theme, Kids Helper, Language, Credits
    const rightGroup = document.createElement('div');
    rightGroup.className = 'hud-group right';

    // 1. Multiplayer / Pass-and-Play / LAN Button
    const mpBtn = document.createElement('button');
    mpBtn.className = 'btn-pill mp-trigger-btn';
    mpBtn.innerHTML = `👥 <b>${tr.multiplayerBtn}</b>`;
    mpBtn.title = tr.mp.title;
    mpBtn.addEventListener('click', this.callbacks.onOpenMultiplayer);
    rightGroup.appendChild(mpBtn);

    // 2. Deck Style Selector (All 5 Decks: Napoletane, Piacentine, Bergamasche, Triestine, Fiaba Moderna)
    const deckGroup = document.createElement('div');
    deckGroup.className = 'deck-picker-group';

    const curDeck = getActiveDeck();
    const deckLabel = tr.deckStyles[curDeck] || curDeck;
    const deckSelectBtn = document.createElement('button');
    deckSelectBtn.className = 'btn-pill deck-btn';
    deckSelectBtn.innerHTML = `🃏 <b>${deckLabel.split(' ')[0]}</b>`;
    deckSelectBtn.title = `${tr.deckMenu}: ${deckLabel}`;

    const deckDropdown = document.createElement('div');
    deckDropdown.className = 'deck-dropdown hidden';
    const decks: DeckStyle[] = [
      'napoletane',
      'piacentine',
      'bresciane',
      'romagnole',
      'trevisane',
      'bergamasche',
      'triestine',
      'moderne',
    ];
    for (const d of decks) {
      const opt = document.createElement('button');
      opt.className = `deck-opt-btn ${d === curDeck ? 'active' : ''}`;
      opt.textContent = tr.deckStyles[d];
      opt.addEventListener('click', () => {
        setActiveDeck(d);
        deckDropdown.classList.add('hidden');
        this.callbacks.onDeckChange(d);
        this.render();
      });
      deckDropdown.appendChild(opt);
    }

    deckSelectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      atmoDropdown.classList.add('hidden');
      deckDropdown.classList.toggle('hidden');
    });

    deckGroup.appendChild(deckSelectBtn);
    deckGroup.appendChild(deckDropdown);
    rightGroup.appendChild(deckGroup);

    // 3. Table Theme Selector (Including Halloween, Xmas, Kids!)
    const atmoGroup = document.createElement('div');
    atmoGroup.className = 'deck-picker-group';

    const atmoNames: Record<TableAtmosphere, string> = {
      trattoria: tr.wizard.trattoria,
      salotto: tr.wizard.salotto,
      piazza: tr.wizard.piazza,
      notte: tr.wizard.notte,
      halloween: tr.wizard.halloween,
      xmas: tr.wizard.xmas,
      bimbi: tr.wizard.bimbi,
    };

    const atmoBtn = document.createElement('button');
    atmoBtn.className = 'btn-pill deck-btn';
    const curAtmoLabel = atmoNames[this.activeAtmosphere] || tr.tableMenu;
    atmoBtn.innerHTML = `🎨 <b>${curAtmoLabel.split(' ').slice(0, 2).join(' ')}</b>`;
    atmoBtn.title = `${tr.tableMenu}: ${curAtmoLabel}`;

    const atmoDropdown = document.createElement('div');
    atmoDropdown.className = 'deck-dropdown hidden';
    const atmospheres: TableAtmosphere[] = [
      'trattoria',
      'salotto',
      'piazza',
      'notte',
      'halloween',
      'xmas',
      'bimbi',
    ];
    for (const a of atmospheres) {
      const opt = document.createElement('button');
      opt.className = `deck-opt-btn ${a === this.activeAtmosphere ? 'active' : ''}`;
      opt.textContent = atmoNames[a];
      opt.addEventListener('click', () => {
        this.activeAtmosphere = a;
        atmoDropdown.classList.add('hidden');
        this.callbacks.onAtmosphereChange(a);
        this.render();
      });
      atmoDropdown.appendChild(opt);
    }

    atmoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deckDropdown.classList.add('hidden');
      atmoDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      deckDropdown.classList.add('hidden');
      atmoDropdown.classList.add('hidden');
    });

    atmoGroup.appendChild(atmoBtn);
    atmoGroup.appendChild(atmoDropdown);
    rightGroup.appendChild(atmoGroup);

    // 4. Simple / Kids Helper Mode
    this.simpleModeBtn = document.createElement('button');
    this.simpleModeBtn.className = `btn-pill ${this.isSimpleMode ? 'active' : ''}`;
    this.simpleModeBtn.innerHTML = this.isSimpleMode ? tr.simpleModeOn : tr.simpleModeOff;
    this.simpleModeBtn.title = tr.simpleModeDesc;
    this.simpleModeBtn.addEventListener('click', () => {
      this.isSimpleMode = !this.isSimpleMode;
      this.simpleModeBtn.className = `btn-pill ${this.isSimpleMode ? 'active' : ''}`;
      this.simpleModeBtn.innerHTML = this.isSimpleMode ? t().simpleModeOn : t().simpleModeOff;
      this.callbacks.onToggleSimpleMode();
    });
    rightGroup.appendChild(this.simpleModeBtn);

    // 5. Language Toggle (IT / EN)
    this.langBtn = document.createElement('button');
    this.langBtn.className = 'btn-pill';
    const isIt = getLang() === 'it';
    this.langBtn.innerHTML = isIt ? '🇮🇹 <b>IT</b>' : '🇬🇧 <b>EN</b>';
    this.langBtn.title = isIt ? 'Switch to English language' : 'Passa alla lingua Italiana';
    this.langBtn.addEventListener('click', () => {
      setLang(getLang() === 'it' ? 'en' : 'it');
      this.render();
      this.callbacks.onLanguageChange();
    });
    rightGroup.appendChild(this.langBtn);

    // 6. Credits & Version 1.0.0 Badge
    const creditsBtn = document.createElement('button');
    creditsBtn.className = 'btn-icon';
    creditsBtn.innerHTML = 'ℹ️ <span style="font-size:0.75rem; opacity:0.85;">v1.0</span>';
    creditsBtn.title = `${tr.credits} (v1.0.0)`;
    creditsBtn.addEventListener('click', this.callbacks.onOpenCredits);
    rightGroup.appendChild(creditsBtn);

    this.el.appendChild(leftGroup);
    this.el.appendChild(centerGroup);
    this.el.appendChild(rightGroup);

    if (this.activeMode === 'scopa' && this.lastScopaState) {
      this.updateScopa(this.lastScopaState);
    } else if (this.activeMode === 'briscola' && this.lastBriscolaState) {
      this.updateBriscola(this.lastBriscolaState);
    } else if (this.activeMode === 'tressette' && this.lastTressetteState) {
      this.updateTressette(this.lastTressetteState);
    } else if (this.activeMode === 'solitario') {
      this.scoreEl.innerHTML = `🎴 <b>${tr.solitario}</b>`;
      this.turnEl.innerHTML = `✨ 40 Carte`;
    }
  }

  public update(state: ScopaMatchState) {
    this.updateScopa(state);
  }

  public updateScopa(state: ScopaMatchState) {
    this.lastScopaState = state;
    if (!this.scoreEl || !this.turnEl || this.activeMode !== 'scopa') return;
    const seats = state.setup.seats;
    const scores = state.cumulativeScores;
    const config = state.setup.config;
    const tr = t();

    if (config.partnerships) {
      this.scoreEl.innerHTML = `<b>${tr.team1}:</b> ${scores[0]} pt &nbsp;|&nbsp; <b>${tr.team2}:</b> ${scores[1]} pt (${tr.target}: ${config.targetScore})`;
    } else {
      const scoreStr = seats
        .map((s, i) => {
          const name =
            s.kind === 'human' && i === 0
              ? tr.youPlayer
              : s.name.toLowerCase().includes('computer')
              ? tr.computerN(i)
              : s.name;
          return `<b>${name}:</b> ${scores[i] ?? 0}`;
        })
        .join(' &nbsp;|&nbsp; ');
      this.scoreEl.innerHTML = `${scoreStr} (${tr.target}: ${config.targetScore})`;
    }

    const activeSeat = seats[state.activeSeat];
    const avatar = getAvatar(activeSeat.avatar);
    const activeName =
      activeSeat.kind === 'human' && state.activeSeat === 0
        ? tr.youPlayer
        : activeSeat.name.toLowerCase().includes('computer')
        ? tr.computerN(state.activeSeat)
        : activeSeat.name;

    this.turnEl.innerHTML = `<span class="avatar-badge" style="background:${avatar.color}">${avatar.emoji}</span> ${tr.turnOf}: <b>${activeName}</b>`;
  }

  public updateBriscola(state: BriscolaMatchState) {
    this.lastBriscolaState = state;
    if (!this.scoreEl || !this.turnEl || this.activeMode !== 'briscola') return;
    const tr = t();
    const seats = state.setup.seats;

    if (state.setup.partnerships) {
      this.scoreEl.innerHTML = `👑 <b>${tr.team1}:</b> ${state.points[0]} pt &nbsp;|&nbsp; <b>${tr.team2}:</b> ${state.points[1]} pt`;
    } else {
      const s0 = seats[0]?.name || tr.youPlayer;
      const s1 = seats[1]?.name || tr.computer;
      this.scoreEl.innerHTML = `👑 <b>${s0}:</b> ${state.points[0]} pt &nbsp;|&nbsp; <b>${s1}:</b> ${state.points[1]} pt`;
    }

    const activeSeat = seats[state.activeSeat];
    const avatar = getAvatar(activeSeat?.avatar || 'nonno');
    const activeName = activeSeat?.name || tr.youPlayer;
    this.turnEl.innerHTML = `<span class="avatar-badge" style="background:${avatar.color}">${avatar.emoji}</span> ${tr.turnOf}: <b>${activeName}</b>`;
  }

  public updateTressette(state: TressetteMatchState) {
    this.lastTressetteState = state;
    if (!this.scoreEl || !this.turnEl || this.activeMode !== 'tressette') return;
    const tr = t();
    const seats = state.setup.seats;

    if (state.partnerships) {
      this.scoreEl.innerHTML = `👑 <b>${tr.team1}:</b> ${state.cumulativeScores[0]} pt (${formatTerzi(state.terziBySide[0])}) &nbsp;|&nbsp; <b>${tr.team2}:</b> ${state.cumulativeScores[1]} pt (${formatTerzi(state.terziBySide[1])})`;
    } else {
      const s0 = seats[0]?.name || tr.youPlayer;
      const s1 = seats[1]?.name || tr.computer;
      this.scoreEl.innerHTML = `👑 <b>${s0}:</b> ${state.cumulativeScores[0]} pt (${formatTerzi(state.terziBySide[0])}) &nbsp;|&nbsp; <b>${s1}:</b> ${state.cumulativeScores[1]} pt (${formatTerzi(state.terziBySide[1])})`;
    }

    const activeSeat = seats[state.activeSeat];
    const avatar = getAvatar(activeSeat?.avatar || 'nonno');
    const activeName = activeSeat?.name || tr.youPlayer;
    this.turnEl.innerHTML = `<span class="avatar-badge" style="background:${avatar.color}">${avatar.emoji}</span> ${tr.turnOf}: <b>${activeName}</b>`;
  }
}
