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
  type: 'promotable';
  numberOfPromotedTeams: number;
  promotionChampionshipInternalName: string;
};

type Relegatable = {
  type: 'relegatable';
  numberOfRelegatedTeams: number;
  relegationChampionshipInternalName: string;
};

// type BaseType = {
//   name: string;
//   ...
// }

// type PromotableType = {
//   type: 'promotable';
//   numberOfPromotedTeams: number;
// } & BaseType;

// type RelagatableType = {
//   type: 'relagatable';
// } & BaseType;

type PromotableFields = { isPromotable: false } | ({ isPromotable: true } & Promotable);

type RelegatableFields = { isRelegatable: false } | ({ isRelegatable: true } & Relegatable);

// type Champ = {
//   id: string;
//   name: string;
//   promotable: PromptableField;
// };

// const c: Champ;
// if (c.promotable.isPromotable) {
//   c.promotable.numberOfPromotedTeams;
// }

// if (championship.type === 'promotable') {
//   championship.numberOfPromotedTeams;
// }

export type Championship = BaseChampionship & PromotableFields & RelegatableFields;
