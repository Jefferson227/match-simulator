import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import { Championship } from '../models/Championship';

export function initChampionships(
  championshipInternalName: string
): OperationResult<ChampionshipContainer> {
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
  const playableChampionship = mapFromJSON(championshipInternalName);
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
    const promotionChampionship = mapFromJSON(
      playableChampionship.promotionChampionshipInternalName
    );

    if (!promotionChampionship) {
      const result = new OperationResult({} as ChampionshipContainer);
      result.setError({
        errorCode: 'object-null-or-undefined',
        message: 'Promotion championship could not be found',
      });
    }

    championshipContainer.promotionChampionship = promotionChampionship;
  }

  if (playableChampionship.isRelegatable) {
    const relegationChampionship = mapFromJSON(
      playableChampionship.relegationChampionshipInternalName
    );

    if (!relegationChampionship) {
      const result = new OperationResult({} as ChampionshipContainer);
      result.setError({
        errorCode: 'object-null-or-undefined',
        message: 'Relegation championship could not be found',
      });
    }

    championshipContainer.relegationChampionship = relegationChampionship;
  }

  return new OperationResult(championshipContainer);
}

function mapFromJSON(championshipInternalName: string): Championship {
  // TODO: To be implemented
  return {} as Championship;
}
