import { rankOf, suitIndex, type CardId } from '../../core/cards/types';

export const CARD_WIDTH = 200;
export const CARD_HEIGHT = 320;
const CX = CARD_WIDTH / 2;
const CY = CARD_HEIGHT / 2;

export type DeckStyle =
  | 'napoletane'
  | 'piacentine'
  | 'bresciane'
  | 'romagnole'
  | 'trevisane'
  | 'bergamasche'
  | 'triestine'
  | 'moderne';

// -----------------------------------------------------------------------------
// Color Palette - Renaissance Italian Playing Cards
// -----------------------------------------------------------------------------
const C = {
  ink: '#1c1917',
  gold: '#d97706',
  goldLight: '#fde68a',
  goldDark: '#92400e',
  crimson: '#dc2626',
  crimsonDark: '#991b1b',
  sapphire: '#2563eb',
  sapphireDark: '#1e40af',
  emerald: '#16a34a',
  emeraldDark: '#166534',
  steel: '#94a3b8',
  steelDark: '#475569',
  wood: '#78350f',
  woodLight: '#b45309',
  parchment: '#faf6ee',
  borderGold: '#c59b27',
  skin: '#fed7aa',
  skinShadow: '#fcd34d',
};

// -----------------------------------------------------------------------------
// Original Vector Suit Symbols
// -----------------------------------------------------------------------------

/**
 * Ornate Italian Coin (Denari) with radiant sunburst and filigree
 */
function renderCoin(cx: number, cy: number, r: number = 22, isSettebello: boolean = false): string {
  const rays = isSettebello ? 16 : 8;
  const rayPath = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * (r * 0.9);
    const y1 = cy + Math.sin(a) * (r * 0.9);
    const x2 = cx + Math.cos(a) * (r * 1.25);
    const y2 = cy + Math.sin(a) * (r * 1.25);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${isSettebello ? '#f59e0b' : C.gold}" stroke-width="${isSettebello ? 2.5 : 1.8}" stroke-linecap="round"/>`;
  }).join('');

  return `
    <g class="symbol-coin">
      ${rayPath}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.goldLight}" stroke="${C.goldDark}" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${(r * 0.78).toFixed(1)}" fill="${C.gold}" stroke="${C.goldDark}" stroke-width="1.2"/>
      <circle cx="${cx}" cy="${cy}" r="${(r * 0.55).toFixed(1)}" fill="${isSettebello ? C.crimson : C.goldLight}" stroke="${C.goldDark}" stroke-width="1"/>
      ${
        isSettebello
          ? `<circle cx="${cx}" cy="${cy}" r="${(r * 0.28).toFixed(1)}" fill="${C.goldLight}"/>
             <path d="M${cx - 6},${cy - r - 7} l3,-6 l3,4 l3,-4 l3,6 Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="0.8"/>`
          : `<circle cx="${cx}" cy="${cy}" r="${(r * 0.22).toFixed(1)}" fill="${C.emerald}" stroke="${C.ink}" stroke-width="0.6"/>`
      }
    </g>
  `;
}

/**
 * Renaissance Italian Goblet / Chalice (Coppe)
 */
function renderCup(cx: number, cy: number, scale: number = 1.0): string {
  return `
    <g transform="translate(${cx},${cy}) scale(${scale})" class="symbol-cup">
      <!-- Pedestal Base -->
      <path d="M-15,22 Q0,17 15,22 L18,25 Q0,20 -18,25 Z" fill="${C.goldDark}" stroke="${C.ink}" stroke-width="1.2"/>
      <path d="M-12,20 Q0,15 12,20 L8,8 Q0,6 -8,8 Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.2"/>
      <!-- Stem with Jewel -->
      <rect x="-3" y="4" width="6" height="8" rx="1.5" fill="${C.goldDark}" stroke="${C.ink}" stroke-width="0.8"/>
      <circle cx="0" cy="8" r="3.5" fill="${C.crimson}" stroke="${C.ink}" stroke-width="0.8"/>
      <!-- Chalice Bowl -->
      <path d="M-18,-14 Q-20,6 0,6 Q20,6 18,-14 Z" fill="${C.goldLight}" stroke="${C.ink}" stroke-width="1.5"/>
      <path d="M-17,-12 Q-18,3 0,4 Q18,3 17,-12 Z" fill="${C.gold}" opacity="0.75"/>
      <!-- Ornate Rim -->
      <ellipse cx="0" cy="-14" rx="18" ry="4.5" fill="${C.goldLight}" stroke="${C.ink}" stroke-width="1.3"/>
      <ellipse cx="0" cy="-14" rx="13" ry="2.8" fill="${C.crimson}" opacity="0.6"/>
      <!-- Acanthus Handles -->
      <path d="M-18,-8 C-26,-8 -26,2 -16,4" fill="none" stroke="${C.goldDark}" stroke-width="2" stroke-linecap="round"/>
      <path d="M18,-8 C26,-8 26,2 16,4" fill="none" stroke="${C.goldDark}" stroke-width="2" stroke-linecap="round"/>
    </g>
  `;
}

/**
 * Italian Renaissance Rapier / Straight Sword (Spade)
 */
function renderSword(cx: number, cy: number, scale: number = 1.0, rot: number = 0): string {
  return `
    <g transform="translate(${cx},${cy}) rotate(${rot}) scale(${scale})" class="symbol-sword">
      <!-- Steel Blade -->
      <path d="M-4,16 L-2,-50 L0,-62 L2,-50 L4,16 Z" fill="${C.steel}" stroke="${C.ink}" stroke-width="1.3"/>
      <path d="M0,16 L0,-56" stroke="${C.steelDark}" stroke-width="0.9" opacity="0.7"/>
      <!-- Swept Guard / Quillons -->
      <path d="M-16,16 C-10,12 10,12 16,16 L14,20 C8,16 -8,16 -14,20 Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.1"/>
      <!-- Grip -->
      <rect x="-3" y="19" width="6" height="15" rx="1.5" fill="${C.crimsonDark}" stroke="${C.ink}" stroke-width="1"/>
      <line x1="-3" y1="23" x2="3" y2="25" stroke="${C.goldLight}" stroke-width="0.8"/>
      <line x1="-3" y1="28" x2="3" y2="30" stroke="${C.goldLight}" stroke-width="0.8"/>
      <!-- Pommel -->
      <circle cx="0" cy="37" r="4.5" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.1"/>
    </g>
  `;
}

/**
 * Curved Italian Scimitar for Pip Combinations (Spade)
 */
function renderScimitar(cx: number, cy: number, scale: number = 1.0, flip: boolean = false, rot: number = 0): string {
  const sX = flip ? -scale : scale;
  return `
    <g transform="translate(${cx},${cy}) rotate(${rot}) scale(${sX}, ${scale})" class="symbol-scimitar">
      <!-- Curved Blade -->
      <path d="M-3,30 C-2,0 16,-35 24,-55 C16,-40 2,-10 -6,30 Z" fill="${C.steel}" stroke="${C.ink}" stroke-width="1.3"/>
      <path d="M-1,28 C0,0 14,-32 20,-50" stroke="${C.steelDark}" stroke-width="0.8" fill="none" opacity="0.6"/>
      <!-- Guard -->
      <path d="M-14,30 Q-4,26 6,32 L4,36 Q-4,30 -12,34 Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.1"/>
      <!-- Hilt -->
      <rect x="-8" y="34" width="5.5" height="13" rx="1.5" fill="${C.crimson}" stroke="${C.ink}" stroke-width="1"/>
      <circle cx="-5" cy="50" r="4" fill="${C.gold}" stroke="${C.ink}" stroke-width="1"/>
    </g>
  `;
}

/**
 * Ceremonial Carved Royal Scepter (Bastoni)
 */
function renderClub(cx: number, cy: number, scale: number = 1.0, rot: number = 0): string {
  return `
    <g transform="translate(${cx},${cy}) rotate(${rot}) scale(${scale})" class="symbol-club">
      <!-- Wood Shaft -->
      <path d="M-4.5,52 L-7,-46 Q-7.5,-55 0,-56 Q7.5,-55 7,-46 L4.5,52 Q0,55 -4.5,52 Z" fill="${C.woodLight}" stroke="${C.ink}" stroke-width="1.3"/>
      <!-- Gold Bands -->
      <rect x="-7" y="-48" width="14" height="4.5" rx="1.2" fill="${C.gold}" stroke="${C.ink}" stroke-width="0.9"/>
      <rect x="-6" y="-12" width="12" height="4.5" rx="1.2" fill="${C.gold}" stroke="${C.ink}" stroke-width="0.9"/>
      <rect x="-5.5" y="24" width="11" height="4.5" rx="1.2" fill="${C.gold}" stroke="${C.ink}" stroke-width="0.9"/>
      <!-- Laurel Leaves -->
      <path d="M-6,-28 C-14,-32 -13,-20 -6,-22 Z" fill="${C.emerald}" stroke="${C.ink}" stroke-width="0.8"/>
      <path d="M6,-2 C14,-6 13,6 6,4 Z" fill="${C.emerald}" stroke="${C.ink}" stroke-width="0.8"/>
      <path d="M-5,10 C-13,6 -12,18 -5,16 Z" fill="${C.emerald}" stroke="${C.ink}" stroke-width="0.8"/>
      <!-- Ornate Finials -->
      <circle cx="0" cy="-57" r="5" fill="${C.goldLight}" stroke="${C.ink}" stroke-width="1.1"/>
      <circle cx="0" cy="54" r="4.5" fill="${C.goldLight}" stroke="${C.ink}" stroke-width="1.1"/>
    </g>
  `;
}

// -----------------------------------------------------------------------------
// Ornate Double-Ended Court Figures (Fante, Cavallo, Re)
// -----------------------------------------------------------------------------

function renderCourtHalves(
  suit: number,
  rank: number
): string {
  // Rank 8: Fante (Page)
  // Rank 9: Cavallo (Knight)
  // Rank 10: Re (King)
  const isFante = rank === 8;
  const isCavallo = rank === 9;
  const isRe = rank === 10;

  const suitColor =
    suit === 0 ? C.goldDark : suit === 1 ? C.crimson : suit === 2 ? C.sapphireDark : C.emeraldDark;

  const titleIt = isFante ? 'FANTE' : isCavallo ? 'CAVALLO' : 'RE';

  // Court figure illustration (one half; we render top half and mirrored bottom half)
  const figureHalf = (yOffset: number, flip: boolean) => {
    const rot = flip ? 180 : 0;
    const trans = `translate(${CX},${CY + yOffset}) rotate(${rot})`;

    let headpiece = '';
    let accessories = '';

    if (isFante) {
      // Renaissance Feathered Beret
      headpiece = `
        <ellipse cx="0" cy="-42" rx="20" ry="8" fill="${suitColor}" stroke="${C.ink}" stroke-width="1.2"/>
        <path d="M-12,-46 C-22,-60 -2,-66 4,-50" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="2" cy="-44" r="3.5" fill="${C.gold}" stroke="${C.ink}" stroke-width="0.8"/>
      `;
      // Collar and Tabard
      accessories = `
        <path d="M-18,-8 L18,-8 L14,24 L-14,24 Z" fill="${suitColor}" stroke="${C.ink}" stroke-width="1.3"/>
        <path d="M-8,-16 L0,-6 L8,-16 Z" fill="#fff" stroke="${C.ink}" stroke-width="1"/>
      `;
    } else if (isCavallo) {
      // Knight Helmet with Plume & Horse silhouette
      headpiece = `
        <path d="M-16,-46 Q0,-58 16,-46 L14,-28 L-14,-28 Z" fill="${C.steel}" stroke="${C.ink}" stroke-width="1.3"/>
        <path d="M-2,-48 Q-4,-68 12,-62 Q6,-48 0,-46" fill="${C.crimson}" stroke="${C.ink}" stroke-width="1"/>
        <line x1="-10" y1="-36" x2="10" y2="-36" stroke="${C.gold}" stroke-width="2"/>
      `;
      // Horse mane & armor breastplate
      accessories = `
        <path d="M-22,-6 Q0,2 22,-6 L18,24 L-18,24 Z" fill="${C.steelDark}" stroke="${C.ink}" stroke-width="1.3"/>
        <circle cx="0" cy="8" r="7" fill="${C.gold}" stroke="${C.ink}" stroke-width="1"/>
      `;
    } else {
      // Royal Crown & Ermine Mantle
      headpiece = `
        <path d="M-16,-42 L-18,-54 L-10,-48 L0,-58 L10,-48 L18,-54 L16,-42 Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.3"/>
        <circle cx="-18" cy="-54" r="2.5" fill="${C.crimson}"/>
        <circle cx="0" cy="-58" r="3" fill="${C.sapphire}"/>
        <circle cx="18" cy="-54" r="2.5" fill="${C.crimson}"/>
      `;
      // Ermine-trimmed Cape & Scepter
      accessories = `
        <path d="M-24,-6 Q0,2 24,-6 L20,24 L-20,24 Z" fill="${C.crimsonDark}" stroke="${C.ink}" stroke-width="1.3"/>
        <!-- Ermine Collar -->
        <path d="M-22,-8 Q0,-2 22,-8 L18,-16 Q0,-10 -18,-16 Z" fill="#fff" stroke="${C.ink}" stroke-width="1"/>
        <circle cx="-10" cy="-12" r="1.5" fill="${C.ink}"/>
        <circle cx="0" cy="-10" r="1.5" fill="${C.ink}"/>
        <circle cx="10" cy="-12" r="1.5" fill="${C.ink}"/>
      `;
    }

    // Mini suit emblem held by court figure
    const heldEmblem =
      suit === 0
        ? renderCoin(24, -2, 10)
        : suit === 1
        ? renderCup(24, 4, 0.45)
        : suit === 2
        ? renderSword(24, 0, 0.45, 20)
        : renderClub(24, 2, 0.45, 15);

    return `
      <g transform="${trans}">
        <!-- Shoulders / Torso -->
        ${accessories}
        <!-- Face & Hair -->
        <circle cx="0" cy="-28" r="13" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.2"/>
        <path d="M-13,-30 C-15,-18 -10,-12 -8,-16" fill="none" stroke="${C.wood}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M13,-30 C15,-18 10,-12 8,-16" fill="none" stroke="${C.wood}" stroke-width="2.5" stroke-linecap="round"/>
        ${
          isRe
            ? `<path d="M-9,-22 Q0,-14 9,-22 L5,-14 Q0,-10 -5,-14 Z" fill="#fff" stroke="${C.ink}" stroke-width="0.8"/>`
            : ''
        }
        <!-- Eyes & Nose -->
        <circle cx="-4" cy="-29" r="1.2" fill="${C.ink}"/>
        <circle cx="4" cy="-29" r="1.2" fill="${C.ink}"/>
        <path d="M0,-28 L-1,-25 L1,-25" stroke="${C.ink}" stroke-width="0.7" fill="none"/>
        ${headpiece}
        ${heldEmblem}
      </g>
    `;
  };

  return `
    <!-- Court Frame -->
    <rect x="22" y="24" width="${CARD_WIDTH - 44}" height="${CARD_HEIGHT - 48}" rx="8" fill="#fff" stroke="${C.borderGold}" stroke-width="1.5"/>
    <rect x="26" y="28" width="${CARD_WIDTH - 52}" height="${CARD_HEIGHT - 56}" rx="6" fill="${suitColor}" opacity="0.06"/>
    
    <!-- Top Half -->
    ${figureHalf(-48, false)}
    
    <!-- Dividing Ribbon with Title -->
    <line x1="30" y1="${CY}" x2="${CARD_WIDTH - 30}" y2="${CY}" stroke="${C.borderGold}" stroke-width="1.5" stroke-dasharray="3 3"/>
    <rect x="${CX - 40}" y="${CY - 10}" width="80" height="20" rx="4" fill="${C.parchment}" stroke="${C.borderGold}" stroke-width="1.2"/>
    <text x="${CX}" y="${CY + 4}" font-family="Cinzel, Georgia, serif" font-weight="bold" font-size="10" text-anchor="middle" fill="${suitColor}" letter-spacing="1.5">${titleIt}</text>

    <!-- Bottom Half (Mirrored) -->
    ${figureHalf(48, true)}
  `;
}

// -----------------------------------------------------------------------------
// Pip Placements & Ace Renderers
// -----------------------------------------------------------------------------

function renderAce(suit: number): string {
  const laurelWreath = `
    <g transform="translate(${CX},${CY})" stroke="${C.emeraldDark}" stroke-width="1.2" fill="${C.emerald}">
      ${Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const x = Math.cos(a) * 62;
        const y = Math.sin(a) * 88;
        return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5" ry="9" transform="rotate(${((a * 180) / Math.PI + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }).join('')}
    </g>
  `;

  switch (suit) {
    case 0: // Denari - Magnificent Radiant Sun
      return (
        laurelWreath +
        `
        <g transform="translate(${CX},${CY})">
          ${renderCoin(0, 0, 36, true)}
        </g>
        <text x="${CX}" y="${CY + 112}" font-family="Cinzel, Georgia, serif" font-weight="bold" font-size="11" text-anchor="middle" fill="${C.goldDark}" letter-spacing="2">ASSO DI DENARI</text>
      `
      );
    case 1: // Coppe - Imperial Chalice
      return (
        laurelWreath +
        renderCup(CX, CY - 6, 1.9) +
        `
        <text x="${CX}" y="${CY + 112}" font-family="Cinzel, Georgia, serif" font-weight="bold" font-size="11" text-anchor="middle" fill="${C.crimsonDark}" letter-spacing="2">ASSO DI COPPE</text>
      `
      );
    case 2: // Spade - Crowned Rapier
      return (
        laurelWreath +
        renderSword(CX, CY, 1.4, 0) +
        `
        <!-- Royal Coronet over blade -->
        <g transform="translate(${CX},${CY - 80}) scale(0.8)">
          <path d="M-15,4 L-18,-8 L-8,-3 L0,-12 L8,-3 L18,-8 L15,4 Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.2"/>
        </g>
        <text x="${CX}" y="${CY + 112}" font-family="Cinzel, Georgia, serif" font-weight="bold" font-size="11" text-anchor="middle" fill="${C.sapphireDark}" letter-spacing="2">ASSO DI SPADE</text>
      `
      );
    default: // Bastoni - Imperial Scepter
      return (
        laurelWreath +
        renderClub(CX, CY, 1.4, 0) +
        `
        <text x="${CX}" y="${CY + 112}" font-family="Cinzel, Georgia, serif" font-weight="bold" font-size="11" text-anchor="middle" fill="${C.emeraldDark}" letter-spacing="2">ASSO DI BASTONI</text>
      `
      );
  }
}

function renderPips(suit: number, rank: number): string {
  const L = CX - 38;
  const R = CX + 38;

  // 1. Coins (Denari) & Cups (Coppe)
  if (suit === 0 || suit === 1) {
    const isSettebello = suit === 0 && rank === 7;
    const drawItem = (x: number, y: number, isCenter: boolean = false) => {
      if (suit === 0) {
        return renderCoin(x, y, isCenter ? 23 : 20, isSettebello && isCenter);
      } else {
        return renderCup(x, y, isCenter ? 0.95 : 0.85);
      }
    };

    const posMap: Record<number, [number, number][]> = {
      2: [
        [CX, CY - 65],
        [CX, CY + 65],
      ],
      3: [
        [CX, CY - 76],
        [CX, CY],
        [CX, CY + 76],
      ],
      4: [
        [L, CY - 60],
        [R, CY - 60],
        [L, CY + 60],
        [R, CY + 60],
      ],
      5: [
        [L, CY - 75],
        [R, CY - 75],
        [CX, CY],
        [L, CY + 75],
        [R, CY + 75],
      ],
      6: [
        [L, CY - 80],
        [R, CY - 80],
        [L, CY],
        [R, CY],
        [L, CY + 80],
        [R, CY + 80],
      ],
      7: [
        [L, CY - 84],
        [R, CY - 84],
        [L, CY - 28],
        [R, CY - 28],
        [CX, CY + 15],
        [L, CY + 84],
        [R, CY + 84],
      ],
    };

    const positions = posMap[rank] ?? [];
    return positions.map(([x, y], idx) => drawItem(x, y, rank === 7 && idx === 4)).join('');
  }

  // 2. Swords (Spade) - Traditional Interlaced Curved Scimitars
  if (suit === 2) {
    if (rank === 2) {
      return renderScimitar(CX - 15, CY, 1.25, false, 8) + renderScimitar(CX + 15, CY, 1.25, true, -8);
    }
    if (rank === 3) {
      return (
        renderScimitar(CX - 22, CY, 1.2, false, 12) +
        renderSword(CX, CY, 1.1, 0) +
        renderScimitar(CX + 22, CY, 1.2, true, -12)
      );
    }
    if (rank === 4) {
      return (
        renderScimitar(CX - 28, CY - 40, 1.0, false, 15) +
        renderScimitar(CX + 28, CY - 40, 1.0, true, -15) +
        renderScimitar(CX - 28, CY + 40, 1.0, false, -15) +
        renderScimitar(CX + 28, CY + 40, 1.0, true, 15)
      );
    }
    if (rank === 5) {
      return (
        renderScimitar(CX - 28, CY - 50, 0.95, false, 15) +
        renderScimitar(CX + 28, CY - 50, 0.95, true, -15) +
        renderSword(CX, CY, 1.0, 0) +
        renderScimitar(CX - 28, CY + 50, 0.95, false, -15) +
        renderScimitar(CX + 28, CY + 50, 0.95, true, 15)
      );
    }
    if (rank === 6) {
      return (
        renderScimitar(CX - 30, CY - 60, 0.9, false, 15) +
        renderScimitar(CX + 30, CY - 60, 0.9, true, -15) +
        renderScimitar(CX - 32, CY, 0.9, false, 10) +
        renderScimitar(CX + 32, CY, 0.9, true, -10) +
        renderScimitar(CX - 30, CY + 60, 0.9, false, -15) +
        renderScimitar(CX + 30, CY + 60, 0.9, true, 15)
      );
    }
    // Rank 7
    return (
      renderScimitar(CX - 30, CY - 65, 0.88, false, 15) +
      renderScimitar(CX + 30, CY - 65, 0.88, true, -15) +
      renderScimitar(CX - 32, CY - 8, 0.88, false, 10) +
      renderScimitar(CX + 32, CY - 8, 0.88, true, -10) +
      renderSword(CX, CY + 15, 0.9, 0) +
      renderScimitar(CX - 30, CY + 68, 0.88, false, -15) +
      renderScimitar(CX + 30, CY + 68, 0.88, true, 15)
    );
  }

  // 3. Batons / Clubs (Bastoni)
  if (rank === 2) {
    return renderClub(CX - 26, CY, 1.15, 0) + renderClub(CX + 26, CY, 1.15, 0);
  }
  if (rank === 3) {
    return (
      renderClub(CX - 35, CY, 1.05, 0) +
      renderClub(CX, CY, 1.05, 0) +
      renderClub(CX + 35, CY, 1.05, 0)
    );
  }
  if (rank === 4) {
    return (
      renderClub(CX - 38, CY, 1.05, 0) +
      renderClub(CX - 13, CY, 1.05, 0) +
      renderClub(CX + 13, CY, 1.05, 0) +
      renderClub(CX + 38, CY, 1.05, 0)
    );
  }
  if (rank === 5) {
    return (
      renderClub(CX - 40, CY, 0.95, 0) +
      renderClub(CX - 20, CY, 0.95, 0) +
      renderClub(CX, CY, 1.1, 0) +
      renderClub(CX + 20, CY, 0.95, 0) +
      renderClub(CX + 40, CY, 0.95, 0)
    );
  }
  if (rank === 6) {
    return (
      renderClub(CX - 44, CY, 0.95, 0) +
      renderClub(CX - 26, CY, 0.95, 0) +
      renderClub(CX - 9, CY, 0.95, 0) +
      renderClub(CX + 9, CY, 0.95, 0) +
      renderClub(CX + 26, CY, 0.95, 0) +
      renderClub(CX + 44, CY, 0.95, 0)
    );
  }
  // Rank 7
  return (
    renderClub(CX - 45, CY, 0.9, 0) +
    renderClub(CX - 30, CY, 0.9, 0) +
    renderClub(CX - 15, CY, 0.9, 0) +
    renderClub(CX, CY, 1.05, 0) +
    renderClub(CX + 15, CY, 0.9, 0) +
    renderClub(CX + 30, CY, 0.9, 0) +
    renderClub(CX + 45, CY, 0.9, 0)
  );
}

// -----------------------------------------------------------------------------
// Corner Index Badges (Accessible Rank & Mini Suit Emblem)
// -----------------------------------------------------------------------------

function renderCornerIndices(rank: number, suit: number): string {
  const rankLabel = rank === 1 ? 'A' : rank === 8 ? '8' : rank === 9 ? '9' : rank === 10 ? '10' : String(rank);
  const color =
    suit === 0 ? C.goldDark : suit === 1 ? C.crimsonDark : suit === 2 ? C.sapphireDark : C.emeraldDark;

  const miniIcon =
    suit === 0
      ? `<circle cx="0" cy="10" r="4.5" fill="${C.gold}" stroke="${C.ink}" stroke-width="0.8"/>`
      : suit === 1
      ? `<path d="M-4,7 Q-4,13 0,13 Q4,13 4,7 Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="0.8"/><rect x="-1" y="13" width="2" height="3" fill="${C.gold}"/><line x1="-3" y1="16" x2="3" y2="16" stroke="${C.gold}" stroke-width="1.2"/>`
      : suit === 2
      ? `<line x1="0" y1="6" x2="0" y2="16" stroke="${C.steelDark}" stroke-width="1.8"/><line x1="-3" y1="13" x2="3" y2="13" stroke="${C.gold}" stroke-width="1.2"/>`
      : `<line x1="0" y1="6" x2="0" y2="16" stroke="${C.woodLight}" stroke-width="2.2" stroke-linecap="round"/>`;

  return `
    <!-- Top-Left Index -->
    <g transform="translate(14, 18)" class="card-index">
      <text x="0" y="0" font-family="Cinzel, Georgia, serif" font-weight="bold" font-size="14" fill="${color}" text-anchor="middle">${rankLabel}</text>
      ${miniIcon}
    </g>
    <!-- Bottom-Right Index (Mirrored) -->
    <g transform="translate(${CARD_WIDTH - 14}, ${CARD_HEIGHT - 18}) rotate(180)" class="card-index">
      <text x="0" y="0" font-family="Cinzel, Georgia, serif" font-weight="bold" font-size="14" fill="${color}" text-anchor="middle">${rankLabel}</text>
      ${miniIcon}
    </g>
  `;
}

// -----------------------------------------------------------------------------
// Card Frame & Flourishes
// -----------------------------------------------------------------------------

function renderCardFrame(): string {
  return `
    <!-- Card Base with Warm Parchment Fill -->
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="14" fill="${C.parchment}" stroke="${C.ink}" stroke-width="1.8"/>
    
    <!-- Outer Inset Gold Border -->
    <rect x="7" y="7" width="${CARD_WIDTH - 14}" height="${CARD_HEIGHT - 14}" rx="10" fill="none" stroke="${C.borderGold}" stroke-width="1.6"/>
    
    <!-- Inner Fine Border -->
    <rect x="11" y="11" width="${CARD_WIDTH - 22}" height="${CARD_HEIGHT - 22}" rx="8" fill="none" stroke="${C.borderGold}" stroke-width="0.8" stroke-dasharray="6 3" opacity="0.65"/>
    
    <!-- Corner Filigree Ornaments -->
    <g fill="${C.borderGold}" opacity="0.75">
      <circle cx="11" cy="11" r="2.5"/>
      <circle cx="${CARD_WIDTH - 11}" cy="11" r="2.5"/>
      <circle cx="11" cy="${CARD_HEIGHT - 11}" r="2.5"/>
      <circle cx="${CARD_WIDTH - 11}" cy="${CARD_HEIGHT - 11}" r="2.5"/>
    </g>
  `;
}

// -----------------------------------------------------------------------------
// Public Generation API
// -----------------------------------------------------------------------------

/**
 * Generates an original, stunning vector SVG for any Italian card (0..39).
 */
export function generateCardSvg(id: CardId, _deck: DeckStyle = 'moderne'): string {
  const suit = suitIndex(id);
  const rank = rankOf(id);

  let body = '';
  if (rank === 1) {
    body = renderAce(suit);
  } else if (rank >= 8) {
    body = renderCourtHalves(suit, rank);
  } else {
    body = renderPips(suit, rank);
  }

  const indices = renderCornerIndices(rank, suit);
  const frame = renderCardFrame();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
    ${frame}
    ${body}
    ${indices}
  </svg>`;
}

/**
 * Generates a luxurious geometric card back (Tessellated Modiano-Style Diamond Lattice).
 */
export function generateBackSvg(_deck: DeckStyle = 'moderne'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
    <defs>
      <pattern id="luxBackPattern" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)">
        <rect width="24" height="24" fill="#1e3a5f" />
        <path d="M0 0h24v24H0z" fill="none" stroke="#2563eb" stroke-width="1.2" opacity="0.5"/>
        <circle cx="12" cy="12" r="3" fill="#d97706" />
        <circle cx="0" cy="0" r="1.5" fill="#fde68a" />
        <circle cx="24" cy="24" r="1.5" fill="#fde68a" />
      </pattern>
    </defs>
    <!-- Card Base -->
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="14" fill="#0f172a" stroke="#1c1917" stroke-width="2"/>
    <!-- Pattern Inset -->
    <rect x="8" y="8" width="${CARD_WIDTH - 16}" height="${CARD_HEIGHT - 16}" rx="10" fill="url(#luxBackPattern)"/>
    <!-- Gold Framing Bands -->
    <rect x="8" y="8" width="${CARD_WIDTH - 16}" height="${CARD_HEIGHT - 16}" rx="10" fill="none" stroke="#d97706" stroke-width="2.5"/>
    <rect x="14" y="14" width="${CARD_WIDTH - 28}" height="${CARD_HEIGHT - 28}" rx="8" fill="none" stroke="#fde68a" stroke-width="1" opacity="0.8"/>
    <!-- Central Medallion -->
    <g transform="translate(${CX},${CY})">
      <circle r="44" fill="#0f172a" stroke="#d97706" stroke-width="2"/>
      <circle r="36" fill="#1e3a5f" stroke="#fde68a" stroke-width="1.2"/>
      <circle r="20" fill="#d97706" stroke="#0f172a" stroke-width="1.5"/>
      <circle r="8" fill="#fde68a"/>
      <!-- Radiating Sun Rays -->
      <path d="M0,-36 L0,-24 M0,24 L0,36 M-36,0 L-24,0 M24,0 L36,0 M-25,-25 L-17,-17 M17,17 L25,25 M25,-25 L17,-17 M-17,17 L-25,25" stroke="#fde68a" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`;
}
