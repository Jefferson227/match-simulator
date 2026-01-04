import Ranking from './Ranking';
import ChampionshipType from '../enums/ChampionshipType';

type BaseChampionship = {
  name: string;
  internalName: string;
  numberOfTeams: number;
  startingTeams: string; // TODO: Change it to Team[] when implemented
  ranking: Ranking;
  matches: string; // TODO: Change it to Match[] when implemented
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
