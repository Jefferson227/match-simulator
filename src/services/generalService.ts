import generalParameters from '../assets/general-parameters.json';
import { ChampionshipConfig } from '../types';

function getAllChampionships(): ChampionshipConfig[] {
  return generalParameters.championships as ChampionshipConfig[];
}

const generalService = { getAllChampionships };

export default generalService;
