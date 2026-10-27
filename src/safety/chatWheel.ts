export interface SafeChatPhrase {
  id: string;
  textIt: string;
  textEn: string;
  emoji: string;
  soundCue?: string;
}

export const SAFE_CHAT_PHRASES: readonly SafeChatPhrase[] = [
  { id: 'scopa', textIt: 'Scopa!', textEn: 'Scopa! (Sweep!)', emoji: '🧹', soundCue: 'sweep' },
  { id: 'bella_presa', textIt: 'Bella presa!', textEn: 'Great capture!', emoji: '👏', soundCue: 'capture' },
  { id: 'mamma_mia', textIt: 'Mamma Mia!', textEn: 'Mamma Mia!', emoji: '🤌' },
  { id: 'complimenti', textIt: 'Complimenti!', textEn: 'Well played!', emoji: '⭐' },
  { id: 'occhio', textIt: 'Occhio!', textEn: 'Watch out!', emoji: '👀' },
  { id: 'forza', textIt: 'Forza!', textEn: "Let's go!", emoji: '💪' },
  { id: 'buona_mano', textIt: 'Buona mano!', textEn: 'Good hand!', emoji: '🃏' },
  { id: 'ci_siamo', textIt: 'Ci siamo!', textEn: 'Here we go!', emoji: '🔥' },
  { id: 'salute', textIt: 'Alla salute!', textEn: 'Cheers!', emoji: '☕' },
  { id: 'bravo', textIt: 'Bravissimo!', textEn: 'Excellent!', emoji: '🎉' },
];
