export type ScopaPresetId =
  | 'classic'
  | 'scopone'
  | 'scientifico'
  | 'assi'
  | 'quindici'
  | 'napola'
  | 'rebello'
  | 'cirulla';

export interface ScopaRulesConfig {
  presetId: ScopaPresetId;
  name: string;
  nameIt: string;
  playerCount: 2 | 3 | 4;
  partnerships: boolean; // For 4 players: team 0 (seats 0 & 2) vs team 1 (seats 1 & 3)
  targetScore: number;   // Usually 11 or 21
  initialHandCards: number; // 3 in Classic, 9 in Scopone, 10 in Scientifico
  initialTableCards: number; // 4 in Classic/Scopone, 0 in Scientifico
  redealOnKings: boolean;    // Redeal if 3 or 4 Kings appear on initial table
  exactMatchPriority: boolean; // Exact single-card capture has priority over sums
  captureMode: 'sum' | 'quindici' | 'cirulla';
  aceSweep: boolean;         // Playing an Ace sweeps all table cards (Asso Pigliatutto)
  aceSweepScoresScopa: boolean; // Whether Ace sweep awards a Scopa point
  napola: boolean;           // Unbroken sequence of Denari from Ace scores extra points
  reBello: boolean;          // King of Denari scores 1 extra point
  cirulla: boolean;          // Matta (7 of Coppe), declarations, dealer 15/30 bonus
  gradedPrimiera: boolean;   // Re=10, Cavallo=9, Fante=8 vs all figures=10
}

export const PRESET_CONFIGS: Record<ScopaPresetId, ScopaRulesConfig> = {
  classic: {
    presetId: 'classic',
    name: 'Classic Scopa',
    nameIt: 'Scopa Classica',
    playerCount: 2,
    partnerships: false,
    targetScore: 11,
    initialHandCards: 3,
    initialTableCards: 4,
    redealOnKings: true,
    exactMatchPriority: true,
    captureMode: 'sum',
    aceSweep: false,
    aceSweepScoresScopa: false,
    napola: false,
    reBello: false,
    cirulla: false,
    gradedPrimiera: false,
  },
  scopone: {
    presetId: 'scopone',
    name: 'Scopone',
    nameIt: 'Scopone a 9 Carte',
    playerCount: 4,
    partnerships: true,
    targetScore: 11,
    initialHandCards: 9,
    initialTableCards: 4,
    redealOnKings: true,
    exactMatchPriority: true,
    captureMode: 'sum',
    aceSweep: false,
    aceSweepScoresScopa: false,
    napola: false,
    reBello: false,
    cirulla: false,
    gradedPrimiera: false,
  },
  scientifico: {
    presetId: 'scientifico',
    name: 'Scopone Scientifico',
    nameIt: 'Scopone Scientifico',
    playerCount: 4,
    partnerships: true,
    targetScore: 21,
    initialHandCards: 10,
    initialTableCards: 0,
    redealOnKings: false,
    exactMatchPriority: true,
    captureMode: 'sum',
    aceSweep: false,
    aceSweepScoresScopa: false,
    napola: false,
    reBello: false,
    cirulla: false,
    gradedPrimiera: false,
  },
  assi: {
    presetId: 'assi',
    name: "Scopa d'Assi / Asso Pigliatutto",
    nameIt: 'Asso Pigliatutto',
    playerCount: 2,
    partnerships: false,
    targetScore: 11,
    initialHandCards: 3,
    initialTableCards: 4,
    redealOnKings: true,
    exactMatchPriority: true,
    captureMode: 'sum',
    aceSweep: true,
    aceSweepScoresScopa: false,
    napola: false,
    reBello: false,
    cirulla: false,
    gradedPrimiera: false,
  },
  quindici: {
    presetId: 'quindici',
    name: 'Scopa di Quindici',
    nameIt: 'Scopa a 15',
    playerCount: 2,
    partnerships: false,
    targetScore: 11,
    initialHandCards: 3,
    initialTableCards: 4,
    redealOnKings: true,
    exactMatchPriority: false, // In Quindici, played card + table cards must equal 15
    captureMode: 'quindici',
    aceSweep: false,
    aceSweepScoresScopa: false,
    napola: false,
    reBello: false,
    cirulla: false,
    gradedPrimiera: false,
  },
  napola: {
    presetId: 'napola',
    name: 'Scopa con Napola',
    nameIt: 'Scopa con Napola',
    playerCount: 2,
    partnerships: false,
    targetScore: 16,
    initialHandCards: 3,
    initialTableCards: 4,
    redealOnKings: true,
    exactMatchPriority: true,
    captureMode: 'sum',
    aceSweep: false,
    aceSweepScoresScopa: false,
    napola: true,
    reBello: false,
    cirulla: false,
    gradedPrimiera: false,
  },
  rebello: {
    presetId: 'rebello',
    name: 'Scopa con Re Bello',
    nameIt: 'Scopa con Re Bello',
    playerCount: 2,
    partnerships: false,
    targetScore: 11,
    initialHandCards: 3,
    initialTableCards: 4,
    redealOnKings: true,
    exactMatchPriority: true,
    captureMode: 'sum',
    aceSweep: false,
    aceSweepScoresScopa: false,
    napola: false,
    reBello: true,
    cirulla: false,
    gradedPrimiera: false,
  },
  cirulla: {
    presetId: 'cirulla',
    name: 'Cirulla (Ligurian Scopa)',
    nameIt: 'Cirulla Ligure',
    playerCount: 2,
    partnerships: false,
    targetScore: 51,
    initialHandCards: 3,
    initialTableCards: 4,
    redealOnKings: false,
    exactMatchPriority: false,
    captureMode: 'cirulla',
    aceSweep: true,
    aceSweepScoresScopa: true,
    napola: false,
    reBello: false,
    cirulla: true,
    gradedPrimiera: false,
  },
};
