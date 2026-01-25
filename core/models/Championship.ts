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
  isPromotable: boolean;
  numberOfPromotableTeams: number;
  promotionChampionshipInternalName: string;
};

type Relegatable = {
  isRelegatable: boolean;
  numberOfRelegatableTeams: number;
  relegationChampionshipInternalName: string;
};

type PromotableFields = { isPromotable: false } | ({ isPromotable: true } & Promotable);

type RelegatableFields = { isRelegatable: false } | ({ isRelegatable: true } & Relegatable);

export type Championship = BaseChampionship & PromotableFields & RelegatableFields;
