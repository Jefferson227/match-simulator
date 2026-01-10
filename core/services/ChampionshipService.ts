import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';

function initChampionships(
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
  return new OperationResult({} as ChampionshipContainer);
}

export default { initChampionships };
