import generalParameters from '../assets/general-parameters.json';

function getAllChampionships(): {
  id: string;
  name: string;
  internalName: string;
  numberOfTeams?: number;
  promotionTeams?: number;
  relegationTeams?: number;
  promotionChampionship?: string;
  relegationChampionship?: string;
}[] {
  return generalParameters.championships;
}

const generalService = { getAllChampionships };

export default generalService;
