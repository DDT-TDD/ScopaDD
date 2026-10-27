import { describe, it, expect } from 'vitest';
import {
  FULL_DECK,
  cardName,
  cardNameIt,
  isCoin,
  isKingOfCoins,
  isMatta,
  isSevenBello,
  makeCardId,
  rankOf,
  suitOf,
  valueOf,
} from '../../src/core/cards/types';

describe('Italian Deck Card Types', () => {
  it('contains exactly 40 unique cards', () => {
    expect(FULL_DECK.length).toBe(40);
    const unique = new Set(FULL_DECK);
    expect(unique.size).toBe(40);
  });

  it('correctly maps suit and rank across all cards', () => {
    // 0: Asso di Denari
    expect(suitOf(0)).toBe('denari');
    expect(rankOf(0)).toBe(1);
    expect(valueOf(0)).toBe(1);
    expect(cardName(0)).toBe('Ace of Coins');
    expect(cardNameIt(0)).toBe('Asso di Denari');

    // 6: Settebello (7 di Denari)
    expect(suitOf(6)).toBe('denari');
    expect(rankOf(6)).toBe(7);
    expect(isSevenBello(6)).toBe(true);
    expect(isCoin(6)).toBe(true);
    expect(cardName(6)).toBe('Seven of Coins');
    expect(cardNameIt(6)).toBe('Sette di Denari');

    // 9: Re Bello (Re di Denari)
    expect(suitOf(9)).toBe('denari');
    expect(rankOf(9)).toBe(10);
    expect(isKingOfCoins(9)).toBe(true);

    // 16: Matta in Cirulla (7 di Coppe)
    expect(suitOf(16)).toBe('coppe');
    expect(rankOf(16)).toBe(7);
    expect(isMatta(16)).toBe(true);

    // 29: Re di Spade
    expect(suitOf(29)).toBe('spade');
    expect(rankOf(29)).toBe(10);
    expect(cardNameIt(29)).toBe('Re di Spade');

    // 30: Asso di Bastoni
    expect(suitOf(30)).toBe('bastoni');
    expect(rankOf(30)).toBe(1);
    expect(cardNameIt(30)).toBe('Asso di Bastoni');
  });

  it('makeCardId reconstructs card IDs correctly', () => {
    for (let s = 0; s < 4; s++) {
      for (let r = 1; r <= 10; r++) {
        const id = makeCardId(s, r);
        expect(suitOf(id)).toBe(['denari', 'coppe', 'spade', 'bastoni'][s]);
        expect(rankOf(id)).toBe(r);
      }
    }
  });

  it('handles invalid card IDs gracefully', () => {
    expect(cardName(-1)).toBe('');
    expect(cardName(40)).toBe('');
    expect(cardName(999)).toBe('');
    expect(cardNameIt(-1)).toBe('');
  });
});
