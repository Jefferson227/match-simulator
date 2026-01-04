import Ranking from './Ranking';
import ChampionshipType from '../enums/ChampionshipType';
import { Team } from './Team';
import Match from './Match';

type BaseChampionship = {
  name: string;
  internalName: string;
  numberOfTeams: number;
  startingTeams: Team;
  ranking: Ranking;
  matches: Match;
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
