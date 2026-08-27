import ChampionshipType from '../../domain/enums/ChampionshipType';
import LeagueType from '../../domain/enums/LeagueType';

type ChampionshipJSONDTO = {
  name: string;
  internalName: string;
  numberOfTeams: number;
  type: ChampionshipType;
  leagueType: LeagueType;
  teamNames: string[];
  numberOfPromotableTeams?: number;
  promotionChampionshipInternalName?: string;
  numberOfRelegatableTeams?: number;
  relegationChampionshipInternalName?: string;
};

export default ChampionshipJSONDTO;
