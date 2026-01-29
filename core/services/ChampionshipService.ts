import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import { getChampionship } from '../../infra/repositories/ChampionshipRepository';

const initChampionships = (
  championshipInternalName: string
): OperationResult<ChampionshipContainer> => {
  try {
    /**
     * 1. Take the `championshipInternalName` and get the corresponding championship
     *    from the JSON in `src/assets/championships.json` (file to be renamed), and
     *    map it into a Championship object called `playableChampionship`.
     * 2. If `playableChampionship.relegationChampionship` is not empty, get the
     *    corresponding team and map it into a Championship object called
     *    `relegationChampionship`.
     * 3. If `playableChampionship.promotionChampionship` is not empty, get the
     *    corresponding team and map it into a Championship object called
     *    `promotionChampionship`.
     * 4. Return a new ChampionshipContainer object containing all Championship
     *    objects created.
     */
    let championshipContainer = {} as ChampionshipContainer;
    const playableChampionship = getChampionship(championshipInternalName, true);
    if (!playableChampionship) {
      const result = new OperationResult({} as ChampionshipContainer);
      result.setError({
        errorCode: 'object-null-or-undefined',
        message: 'Playable championship could not be found',
      });
      return result;
    }

    championshipContainer.playableChampionship = playableChampionship;

    if (playableChampionship.isPromotable) {
      const promotionChampionship = getChampionship(
        playableChampionship.promotionChampionshipInternalName,
        false
      );

      if (!promotionChampionship) {
        const result = new OperationResult({} as ChampionshipContainer);
        result.setError({
          errorCode: 'object-null-or-undefined',
          message: 'Promotion championship could not be found',
        });
        return result;
      }

      championshipContainer.promotionChampionship = promotionChampionship;
    }

    if (playableChampionship.isRelegatable) {
      const relegationChampionship = getChampionship(
        playableChampionship.relegationChampionshipInternalName,
        false
      );

      if (!relegationChampionship) {
        const result = new OperationResult({} as ChampionshipContainer);
        result.setError({
          errorCode: 'object-null-or-undefined',
          message: 'Relegation championship could not be found',
        });
        return result;
      }

      championshipContainer.relegationChampionship = relegationChampionship;
    }

    const result = new OperationResult(championshipContainer);
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult({} as ChampionshipContainer);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({
      errorCode: 'exception',
      message,
    });
  }
};

export default {
  initChampionships,
};
