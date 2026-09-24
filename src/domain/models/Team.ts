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
  isControlledByHuman: boolean;
};
