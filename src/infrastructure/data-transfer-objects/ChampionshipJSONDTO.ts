import ChampionshipType from '../../domain/enums/ChampionshipType';
import LeagueType from '../../domain/enums/LeagueType';
import ChampionshipPhase, { PhaseVariant } from '../../domain/models/ChampionshipPhase';
import { PromotionRule, RelegationRule } from '../../domain/models/Championship';

type ChampionshipJSONDTO = {
  name: string;
  internalName: string;
  numberOfTeams: number;
  /** The club count the division is growing towards. Absent means it is stable. */
  targetNumberOfTeams?: number;
  type: ChampionshipType;
  leagueType: LeagueType;
  teamNames: string[];
  /** `false` for a cup: no table, only a bracket. Absent means the competition is a league. */
  hasLeagueTable?: boolean;
  numberOfPromotableTeams?: number;
  promotionChampionshipInternalName?: string;
  promotionRule?: PromotionRule;
  /** The grouped round-robin phase a `'phase-group-position'` promotion reads. */
  promotionPhaseIndex?: number;
  numberOfRelegatableTeams?: number;
  relegationChampionshipInternalName?: string;
  relegationRule?: RelegationRule;
  /** Clubs relegated once `targetNumberOfTeams` is reached. */
  numberOfRelegatableTeamsAtTarget?: number;
  /** The real competition format — see `src/domain/models/ChampionshipPhase.ts`. */
  phases?: ChampionshipPhase[];
  /**
   * The shapes this competition can be played in, most demanding first. `phases` must equal the
   * variant matching `numberOfTeams`; the repository rejects seed data where it does not.
   */
  phaseVariants?: PhaseVariant[];
  /** `replace-in-place` keeps every non-exchanged club at its list position across a roll-over. */
  rolloverSlotting?: 'replace-in-place';
};

export default ChampionshipJSONDTO;
