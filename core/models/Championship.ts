import Standing from './Standing';
import ChampionshipType from '../enums/ChampionshipType';
import { Team } from './Team';
import MatchContainer from './MatchContainer';

type BaseChampionship = {
  name: string;
  internalName: string;
  numberOfTeams: number;
  startingTeams: Team;
  standings: Standing[];
  matches: MatchContainer;
  type: ChampionshipType;
  hasTeamControlledByHuman: boolean;
};

type Promotable = {
  numberOfPromotedTeams: number;
  promotionChampionship: string;
};

type Relegatable = {
  numberOfRelegatedTeams: number;
  relegationChampionship: string;
};

export type PromotableChampionship = BaseChampionship & Promotable;
export type RelegatableChampionship = BaseChampionship & Relegatable;
export type Championship = BaseChampionship & Promotable & Relegatable;
