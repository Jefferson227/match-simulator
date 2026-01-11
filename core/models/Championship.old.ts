import Standing from './Standing';
import ChampionshipType from '../enums/ChampionshipType';
import { Team } from './Team';
import MatchContainer from './MatchContainer';

type BaseChampionship = {
  id: string;
  name: string;
  internalName: string;
  numberOfTeams: number;
  startingTeams: Team[];
  standings: Standing[];
  matches: MatchContainer;
  type: ChampionshipType;
  hasTeamControlledByHuman: boolean;
};

type Promotable = {
  numberOfPromotedTeams: number;
  promotionChampionshipInternalName: string;
};

type Relegatable = {
  numberOfRelegatedTeams: number;
  relegationChampionshipInternalName: string;
};

export type ChampionshipOld = BaseChampionship & Partial<Promotable> & Partial<Relegatable>;
