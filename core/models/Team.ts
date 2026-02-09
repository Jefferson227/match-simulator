import TeamColors from './TeamColors';
import Player from './Player';

export type Team = {
  id: `${string}-${string}-${string}-${string}-${string}`;
  fullName: string;
  shortName: string;
  abbreviation: string;
  colors: TeamColors;
  players: Player[];
  morale: number;
  isControlledByHuman: boolean;
};
