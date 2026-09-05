import ChampionshipType from '../../domain/enums/ChampionshipType';
import LeagueType from '../../domain/enums/LeagueType';
import ChampionshipPhase from '../../domain/models/ChampionshipPhase';
import { PromotionRule, RelegationRule } from '../../domain/models/Championship';

type ChampionshipJSONDTO = {
  name: string;
  internalName: string;
  numberOfTeams: number;
  type: ChampionshipType;
  leagueType: LeagueType;
  teamNames: string[];
  numberOfPromotableTeams?: number;
  promotionChampionshipInternalName?: string;
  promotionRule?: PromotionRule;
  numberOfRelegatableTeams?: number;
  relegationChampionshipInternalName?: string;
  relegationRule?: RelegationRule;
  /** The real competition format. Declared only — see `src/domain/models/ChampionshipPhase.ts`. */
  phases?: ChampionshipPhase[];
};

export default ChampionshipJSONDTO;
