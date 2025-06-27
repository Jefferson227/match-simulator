import generalParameters from '../assets/general-parameters.json';

function getAllChampionships(): {
  id: string;
  name: string;
  fileName: string;
}[] {
  return generalParameters.championships;
}

const generalService = { getAllChampionships };

export default generalService;
