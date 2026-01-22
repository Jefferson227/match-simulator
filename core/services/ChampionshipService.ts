import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import { Championship } from '../models/Championship';
import championshipsJSON from '../../assets/championships.json';
import ChampionshipJSONDTO from '../data-transfer-objects/ChampionshipJSONDTO';

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
  const playableChampionship = mapFromJSON(championshipInternalName, true);
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
    const relegationChampionship = mapFromJSON(
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

  return new OperationResult(championshipContainer);
}

function mapFromJSON(
  championshipInternalName: string,
  hasTeamControlledByHuman: boolean
): Championship | undefined {
  // TODO: Finish the implementation and move this to the repository layer
  const championships = championshipsJSON as ChampionshipJSONDTO[];
  const championship = championships.find(
    (champ) => champ.internalName === championshipInternalName
  );

  if (!championship) return undefined;

  const baseChampionship = {
    id: championship.id,
    name: championship.name,
    internalName: championship.internalName,
    numberOfTeams: championship.numberOfTeams,
    startingTeams: [],
    standings: [],
    matches: {
      timer: 0,
      currentSeason: 0,
      currentRound: 0,
      totalRounds: 0,
      matches: [],
    },
    type: championship.type,
    hasTeamControlledByHuman,
  };

  // TODO: Adjust this part to use the conditional assignment for promotable or relegatable championships
  const isPromotable =
    typeof championship.promotionTeams === 'number' && !!championship.promotionChampionship;
  const isRelegatable =
    typeof championship.relegationTeams === 'number' && !!championship.relegationChampionship;

  if (isPromotable && isRelegatable) {
    return {
      ...baseChampionship,
      isPromotable: true,
      numberOfPromotedTeams: championship.promotionTeams!,
      promotionChampionshipInternalName: championship.promotionChampionship!,
      isRelegatable: true,
      numberOfRelegatedTeams: championship.relegationTeams!,
      relegationChampionshipInternalName: championship.relegationChampionship!,
    };
  }

  if (isPromotable) {
    return {
      ...baseChampionship,
      isPromotable: true,
      numberOfPromotedTeams: championship.promotionTeams!,
      promotionChampionshipInternalName: championship.promotionChampionship!,
      isRelegatable: false,
    };
  }

  if (isRelegatable) {
    return {
      ...baseChampionship,
      isPromotable: false,
      isRelegatable: true,
      numberOfRelegatedTeams: championship.relegationTeams!,
      relegationChampionshipInternalName: championship.relegationChampionship!,
    };
  }

  return {
    ...baseChampionship,
    isPromotable: false,
    isRelegatable: false,
  };
}
