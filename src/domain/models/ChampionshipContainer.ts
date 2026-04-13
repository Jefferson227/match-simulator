import { Championship } from './Championship';

type ChampionshipContainer = {
  playableChampionship: Championship;
  promotionChampionship?: Championship;
  relegationChampionship?: Championship;
};

export default ChampionshipContainer;
