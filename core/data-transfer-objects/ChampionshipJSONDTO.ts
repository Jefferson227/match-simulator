import ChampionshipType from '../enums/ChampionshipType';

type ChampionshipJSONDTO = {
  id: string;
  name: string;
  internalName: string;
  numberOfTeams: number;
  promotionTeams?: number;
  relegationTeams?: number;
  promotionChampionship?: string;
  relegationChampionship?: string;
  type: ChampionshipType;
  teams?: string[];
};

export default ChampionshipJSONDTO;
