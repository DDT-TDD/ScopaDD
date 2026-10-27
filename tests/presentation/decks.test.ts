import { describe, expect, it } from 'vitest';
import {
  generateCardSvg,
  generateBackSvg,
  type DeckStyle,
} from '../../src/presentation/deckStyles/vectorDecks';
import {
  cardFaceUrl,
  cardBackUrl,
  setActiveDeck,
  getActiveDeck,
} from '../../src/presentation/cards';

describe('Regional Card Decks & Art Generator', () => {
  const allDecks: DeckStyle[] = ['napoletane', 'piacentine', 'bergamasche', 'triestine', 'moderne'];

  it('generates valid SVG artwork for all 40 cards in vector deck', () => {
    for (let c = 0; c < 40; c++) {
      const svg = generateCardSvg(c, 'moderne');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox="0 0 200 320"');
    }
  });

  it('generates distinctive, valid back SVGs', () => {
    for (const deck of allDecks) {
      const backSvg = generateBackSvg(deck);
      expect(backSvg).toContain('<svg');
      expect(backSvg).toContain('</svg>');
      expect(backSvg).toContain('viewBox="0 0 200 320"');
    }
  });

  it('original moderne deck includes Renaissance court figures and corner rank badges', () => {
    const fanteSvg = generateCardSvg(7, 'moderne');
    expect(fanteSvg).toContain('FANTE');
    expect(fanteSvg).toContain('card-index');

    const cavalloSvg = generateCardSvg(8, 'moderne');
    expect(cavalloSvg).toContain('CAVALLO');

    const reSvg = generateCardSvg(9, 'moderne');
    expect(reSvg).toContain('RE');

    const settebelloSvg = generateCardSvg(6, 'moderne');
    expect(settebelloSvg).toContain('symbol-coin');
  });

  it('switches active deck across all 5 regional styles (Napoletane, Piacentine, Bergamasche, Triestine, Moderne)', () => {
    setActiveDeck('napoletane');
    expect(getActiveDeck()).toBe('napoletane');
    expect(cardFaceUrl(7)).toContain('./cards/napoletane/07.webp');
    expect(cardBackUrl()).toContain('./cards/napoletane/back.webp');

    setActiveDeck('piacentine');
    expect(getActiveDeck()).toBe('piacentine');
    expect(cardFaceUrl(7)).toContain('./cards/piacentine/07.webp');
    expect(cardBackUrl()).toContain('./cards/piacentine/back.svg');

    setActiveDeck('bergamasche');
    expect(getActiveDeck()).toBe('bergamasche');
    expect(cardFaceUrl(7)).toContain('./cards/bergamasche/07.webp');
    expect(cardBackUrl()).toContain('./cards/piacentine/back.svg');

    setActiveDeck('triestine');
    expect(getActiveDeck()).toBe('triestine');
    expect(cardFaceUrl(7)).toContain('./cards/triestine/07.webp');
    expect(cardBackUrl()).toContain('./cards/triestine/back.webp');

    setActiveDeck('moderne');
    expect(getActiveDeck()).toBe('moderne');
    expect(cardFaceUrl(7)).toBeDefined();
    expect(cardBackUrl()).toBeDefined();
  });
});
