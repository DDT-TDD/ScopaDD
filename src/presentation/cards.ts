import { cardName, cardNameIt, type CardId } from '../core/cards/types';
import {
  generateBackSvg,
  generateCardSvg,
  type DeckStyle,
} from './deckStyles/vectorDecks';

export type { DeckStyle };

const VALID_DECKS: readonly DeckStyle[] = [
  'napoletane',
  'piacentine',
  'bresciane',
  'romagnole',
  'trevisane',
  'bergamasche',
  'triestine',
  'moderne',
];

const savedDeck =
  typeof localStorage !== 'undefined'
    ? (localStorage.getItem('scopa_deck_style') as DeckStyle)
    : null;

let activeDeckStyle: DeckStyle =
  savedDeck && VALID_DECKS.includes(savedDeck) ? savedDeck : 'napoletane';

const svgUrlCache = new Map<string, string>();

function svgToBlobUrl(svg: string): string {
  if (typeof window === 'undefined' || !window.URL?.createObjectURL) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

export function getActiveDeck(): DeckStyle {
  return activeDeckStyle;
}

export function applyDeckAspectRatio(deck: DeckStyle = activeDeckStyle) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.deck = deck;
  }
}

export function setActiveDeck(deck: DeckStyle) {
  activeDeckStyle = deck;
  applyDeckAspectRatio(deck);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('scopa_deck_style', deck);
  }
}

applyDeckAspectRatio(activeDeckStyle);

export function cardFaceUrl(id: CardId, deck: DeckStyle = activeDeckStyle): string {
  const pad = id < 10 ? `0${id}` : `${id}`;
  if (deck === 'napoletane') {
    return `./cards/napoletane/${pad}.webp`;
  }
  if (deck === 'piacentine') {
    return `./cards/piacentine/${pad}.webp`;
  }
  if (deck === 'bresciane') {
    return `./cards/bresciane/${pad}.png`;
  }
  if (deck === 'romagnole') {
    return `./cards/romagnole/${pad}.png`;
  }
  if (deck === 'trevisane') {
    return `./cards/trevisane/${pad}.png`;
  }
  if (deck === 'bergamasche') {
    return `./cards/bergamasche/${pad}.webp`;
  }
  if (deck === 'triestine') {
    return `./cards/triestine/${pad}.webp`;
  }

  // Vector Decks (Fiaba Moderna / Capolavoro)
  const cacheKey = `${deck}_face_${id}`;
  let url = svgUrlCache.get(cacheKey);
  if (!url) {
    const svg = generateCardSvg(id, deck);
    url = svgToBlobUrl(svg);
    svgUrlCache.set(cacheKey, url);
  }
  return url;
}

export function cardBackUrl(deck: DeckStyle = activeDeckStyle): string {
  if (deck === 'napoletane') {
    return `./cards/napoletane/back.webp`;
  }
  if (deck === 'piacentine') {
    return `./cards/piacentine/back.svg`;
  }
  if (deck === 'bresciane') {
    return `./cards/bresciane/back.png`;
  }
  if (deck === 'romagnole') {
    return `./cards/romagnole/back.png`;
  }
  if (deck === 'trevisane') {
    return `./cards/trevisane/back.png`;
  }
  if (deck === 'triestine') {
    return `./cards/triestine/back.webp`;
  }
  if (deck === 'bergamasche') {
    return `./cards/piacentine/back.svg`;
  }

  const cacheKey = `${deck}_back`;
  let url = svgUrlCache.get(cacheKey);
  if (!url) {
    const svg = generateBackSvg(deck);
    url = svgToBlobUrl(svg);
    svgUrlCache.set(cacheKey, url);
  }
  return url;
}

export function preloadDeck(deck: DeckStyle = activeDeckStyle) {
  for (let c = 0; c < 40; c++) {
    const img = new Image();
    img.src = cardFaceUrl(c, deck);
  }
  const backImg = new Image();
  backImg.src = cardBackUrl(deck);
}

export interface CreateCardElementOptions {
  faceDown?: boolean;
  selectable?: boolean;
  onClick?: () => void;
  deck?: DeckStyle;
  lang?: 'it' | 'en';
  badgeText?: string;
  badgeClass?: string;
}

/**
 * Creates an accessible, responsive DOM element representing a card.
 */
export function createCardElement(
  id: CardId,
  options: CreateCardElementOptions = {}
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'card-item';
  el.dataset.cardId = String(id);

  const lang = options.lang ?? 'it';
  const name = lang === 'it' ? cardNameIt(id) : cardName(id);
  const deck = options.deck ?? activeDeckStyle;
  el.dataset.deck = deck;

  if (options.faceDown) {
    el.classList.add('face-down');
    el.setAttribute('aria-label', lang === 'it' ? 'Carta coperta' : 'Face-down card');
    const img = document.createElement('img');
    img.src = cardBackUrl(deck);
    img.alt = 'Card back';
    img.draggable = false;
    img.onerror = () => {
      img.src = svgToBlobUrl(generateBackSvg(deck));
    };
    el.appendChild(img);
  } else {
    el.setAttribute('aria-label', name);
    const img = document.createElement('img');
    img.src = cardFaceUrl(id, deck);
    img.alt = name;
    img.draggable = false;
    img.onerror = () => {
      img.src = svgToBlobUrl(generateCardSvg(id, deck));
    };
    el.appendChild(img);

    if (options.badgeText) {
      const badge = document.createElement('span');
      badge.className = `card-helper-badge ${options.badgeClass ?? ''}`;
      badge.textContent = options.badgeText;
      el.appendChild(badge);
    }
  }

  if (options.selectable) {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    if (options.onClick) {
      el.addEventListener('click', options.onClick);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          options.onClick?.();
        }
      });
    }
  }

  return el;
}
