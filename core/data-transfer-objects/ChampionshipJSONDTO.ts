import ChampionshipType from '../enums/ChampionshipType';

type ChampionshipJSONDTO = {
  name: string;
  internalName: string;
  numberOfTeams: number;
  type: ChampionshipType;
  teamNames: string[];
  numberOfPromotableTeams: number;
  promotionChampionshipInternalName: string;
  numberOfRelegatableTeams: number;
  relegationChampionshipInternalName: string;
};

export default ChampionshipJSONDTO;
