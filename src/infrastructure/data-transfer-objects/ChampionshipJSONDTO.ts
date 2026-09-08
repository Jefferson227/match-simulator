import ChampionshipType from '../../domain/enums/ChampionshipType';
import LeagueType from '../../domain/enums/LeagueType';
import ChampionshipPhase from '../../domain/models/ChampionshipPhase';
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
  numberOfPromotableTeams?: number;
  promotionChampionshipInternalName?: string;
  promotionRule?: PromotionRule;
  numberOfRelegatableTeams?: number;
  relegationChampionshipInternalName?: string;
  relegationRule?: RelegationRule;
  /** Clubs relegated once `targetNumberOfTeams` is reached. */
  numberOfRelegatableTeamsAtTarget?: number;
  /** The real competition format — see `src/domain/models/ChampionshipPhase.ts`. */
  phases?: ChampionshipPhase[];
};

export default ChampionshipJSONDTO;
