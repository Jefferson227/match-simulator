import Standing from './Standing';
import ChampionshipType from '../enums/ChampionshipType';
import ChampionshipPhase from './ChampionshipPhase';
import LeagueType from '../enums/LeagueType';
import { Team } from './Team';
import MatchContainer from './MatchContainer';

export type PromotionRule = 'table-position' | 'semifinalists';

export type RelegationRule = 'table-position' | 'first-phase-table-position';

type BaseChampionship = {
  id: string;
  name: string;
  internalName: string;
  numberOfTeams: number;
  teams: Team[];
  standings: Standing[];
  matchContainer: MatchContainer;
  type: ChampionshipType;
  leagueType: LeagueType;
  hasTeamControlledByHuman: boolean;
  /**
   * The real competition format, as declared in `championships.json`. Recorded only — the match
   * engine still plays `type`. See `src/domain/models/ChampionshipPhase.ts`.
   */
  phases?: ChampionshipPhase[];
};

type Promotable = {
  isPromotable: boolean;
  numberOfPromotableTeams: number;
  promotionChampionshipInternalName: string;
  /**
   * How the promoted clubs are picked. Defaults to `'table-position'` when absent.
   * `'semifinalists'` — everyone who reached the semifinal goes up, whatever their table position
   * (Brasileirão Feminino A2 and A3). Not honoured yet; MS-103.
   */
  promotionRule?: PromotionRule;
};

type Relegatable = {
  isRelegatable: boolean;
  numberOfRelegatableTeams: number;
  relegationChampionshipInternalName: string;
  /**
   * Which table the relegated clubs are read off. Defaults to `'table-position'` when absent.
   * `'first-phase-table-position'` — the bottom of the 1ª Fase table, not the final classification
   * (Brasileirão Feminino A1 and A2). Not honoured yet; MS-103.
   */
  relegationRule?: RelegationRule;
};

type PromotableFields = { isPromotable: false } | ({ isPromotable: true } & Promotable);

type RelegatableFields = { isRelegatable: false } | ({ isRelegatable: true } & Relegatable);

export type Championship = BaseChampionship & PromotableFields & RelegatableFields;
