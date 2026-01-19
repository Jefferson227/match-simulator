type ChampionshipJSONDTO = {
  id: string;
  name: string;
  internalName: string;
  numberOfTeams?: number;
  promotionTeams?: number;
  relegationTeams?: number;
  promotionChampionship?: string;
  relegationChampionship?: string;
  teams?: string[];
};

export default ChampionshipJSONDTO;
