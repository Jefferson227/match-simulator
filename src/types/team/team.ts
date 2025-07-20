import { Player } from '../player';

export interface TeamColors {
  outline: string;
  background: string;
  name: string;
}

export interface BaseTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  colors: TeamColors;
  players: Player[]; // All available players
  morale: number;
  formation: string;
  overallMood: number;
  initialOverallStrength: number;
}

export interface MatchTeam {
  id: string;
  name: string;
  abbreviation: string;
  colors: TeamColors;
  starters: Player[]; // Only selected starters
  substitutes: Player[]; // Only selected substitutes
  formation: string;
  isHomeTeam: boolean;
  score: number;
  morale: number;
  overallMood: number;
}
