import TeamColors from './TeamColors';
import Player from './Player';
import Coach from './Coach';

export type Team = {
  id: `${string}-${string}-${string}-${string}-${string}`;
  fullName: string;
  shortName: string;
  abbreviation: string;
  colors: TeamColors;
  players: Player[];
  coach?: Coach;
  morale: number;
  // Persisted: the club's place in its division's strength range (MS-116). Undefined for a club
  // that only plays cups.
  level?: number;
  isControlledByHuman: boolean;
};
