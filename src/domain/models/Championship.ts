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
  /**
   * The club count the division is growing towards, when it is growing. A1 is being expanded
   * 16 → 18 → 20 by relegating 2 and promoting 4 (CBF, 17/01/2025 — a news article, not a
   * regulation; see `wiki/concepts/known-contradictions.md`). Absent means the division is stable
   * and `numberOfTeams` never changes.
   */
  targetNumberOfTeams?: number;
  teams: Team[];
  standings: Standing[];
  matchContainer: MatchContainer;
  type: ChampionshipType;
  leagueType: LeagueType;
  hasTeamControlledByHuman: boolean;
  /**
   * The real competition format, as declared in `championships.json`.
   * See `src/domain/models/ChampionshipPhase.ts`.
   */
  phases?: ChampionshipPhase[];
  /**
   * Whether the competition has a league table at all. Absent or `true` for every division; `false`
   * for a cup, which is a bracket with no standings (`standings` stays empty).
   */
  hasLeagueTable?: boolean;
  /**
   * Clubs joining at each phase, indexed by phase — the shape staggered entry needs. Absent for a
   * competition whose whole field starts together.
   */
  phaseEntrants?: Team[][];
  /**
   * Index into `phases` of the phase currently being played. Absent for an unphased
   * championship, which has no phases to track.
   */
  currentPhaseIndex?: number;
  /**
   * The clubs still alive in the competition — the whole field during the first phase, then the
   * qualifiers of each phase. Absent for an unphased championship.
   */
  survivingTeamIds?: Team['id'][];
  /**
   * The 1ª Fase table, held aside before the standings are zeroed for the second phase.
   * A1 and A2 relegate off this table rather than the final classification
   * (REC A1 Art. 26, REC A2 Art. 25).
   */
  firstPhaseStandings?: Standing[];
  /**
   * The clubs that played each phase, indexed by phase. `phaseParticipants[2]` for A1 is the four
   * semifinalists — which is how A2 and A3 promote, since a semifinalist need not be near the top
   * of any table (REC A2 Art. 5º, REC A3 Art. 5º).
   */
  phaseParticipants?: Team['id'][][];
  /**
   * Points and goals summed across every phase played so far. Drives `accumulated-points` second-leg
   * hosting and the final classification (REC A1 Art. 27, REC A3 Art. 21).
   */
  accumulatedStandings?: Standing[];
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
  /**
   * How many clubs are relegated once the division has reached `targetNumberOfTeams`. A1 switches
   * to 4 down / 4 up at 20 clubs, which balances against A2's four semifinalists. CBF has published
   * no post-expansion rule, so this is inference — see `wiki/decisions/`.
   */
  numberOfRelegatableTeamsAtTarget?: number;
};

type PromotableFields = { isPromotable: false } | ({ isPromotable: true } & Promotable);

type RelegatableFields = { isRelegatable: false } | ({ isRelegatable: true } & Relegatable);

export type Championship = BaseChampionship & PromotableFields & RelegatableFields;
