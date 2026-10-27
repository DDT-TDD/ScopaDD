export interface AvatarInfo {
  id: string;
  name: string;
  nameIt: string;
  emoji: string;
  color: string;
}

export const AVATARS: readonly AvatarInfo[] = [
  { id: 'nonno', name: 'Nonno Mario', nameIt: 'Nonno Mario', emoji: '👴', color: '#c2410c' },
  { id: 'nonna', name: 'Nonna Rosa', nameIt: 'Nonna Rosa', emoji: '👵', color: '#be185d' },
  { id: 'wolf', name: 'Luppolo the Wolf', nameIt: 'Lupo Luppolo', emoji: '🐺', color: '#475569' },
  { id: 'fox', name: 'Gigi the Fox', nameIt: 'Volpe Gigi', emoji: '🦊', color: '#ea580c' },
  { id: 'cat', name: 'Bella the Cat', nameIt: 'Gatta Bella', emoji: '🐱', color: '#ca8a04' },
  { id: 'sparrow', name: 'Chicco the Sparrow', nameIt: 'Passerotto Chicco', emoji: '🐦', color: '#0284c7' },
  { id: 'sun', name: 'Sole Splendente', nameIt: 'Sole Splendente', emoji: '☀️', color: '#eab308' },
  { id: 'coffee', name: 'Espresso Maker', nameIt: 'Moka Express', emoji: '☕', color: '#78350f' },
  { id: 'vespa', name: 'Vespa Rider', nameIt: 'Vespa Sprint', emoji: '🛵', color: '#16a34a' },
  { id: 'chef', name: 'Chef Peppe', nameIt: 'Cuoco Peppe', emoji: '👨‍🍳', color: '#e11d48' },
  { id: 'pizza', name: 'Pizza Margherita', nameIt: 'Pizza Margherita', emoji: '🍕', color: '#d97706' },
  { id: 'bear', name: 'Orso Bruno', nameIt: 'Orso Bruno', emoji: '🐻', color: '#854d0e' },
  { id: 'dog', name: 'Cane Bruno', nameIt: 'Cane Bruno', emoji: '🐶', color: '#65a30d' },
  { id: 'owl', name: 'Gufo Saggio', nameIt: 'Gufo Saggio', emoji: '🦉', color: '#4f46e5' },
  { id: 'dolphin', name: 'Delfino Blu', nameIt: 'Delfino Blu', emoji: '🐬', color: '#0891b2' },
  { id: 'artist', name: 'Maestro Leonardo', nameIt: 'Maestro Leonardo', emoji: '🎨', color: '#9333ea' },
];

export function getAvatar(id: string): AvatarInfo {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export function randomAvatar(): AvatarInfo {
  const idx = Math.floor(Math.random() * AVATARS.length);
  return AVATARS[idx];
}
