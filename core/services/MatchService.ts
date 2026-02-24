import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import { Championship } from '../models/Championship';
import { runMatchTick } from '../features/match-simulation/MatchSimulationEngine';
import { RandomProvider } from '../features/match-simulation/types';
import { getRandomNumber } from '../utils/Utils';

type MatchServiceDependencies = {
  rng?: RandomProvider;
};

const defaultDependencies: Required<MatchServiceDependencies> = {
  rng: {
    nextInt: getRandomNumber,
  },
};

function simulateChampionshipMatches(
  championship: Championship,
  rng: RandomProvider
): Championship {
  const matchContainer = championship.matchContainer;
  if (!matchContainer.rounds?.length) return championship;

  const currentRoundIndex = matchContainer.rounds.findIndex(
    (round) => round.number === matchContainer.currentRound
  );
  if (currentRoundIndex === -1) return championship;

  const currentRound = matchContainer.rounds[currentRoundIndex];
  if (currentRound.status !== 'in-progress') return championship;
  if (matchContainer.timer >= 90) return championship;

  const minute = matchContainer.timer;
  const updatedMatches = currentRound.matches.map((match) => runMatchTick(match, minute, rng));
  const updatedRounds = matchContainer.rounds.slice();
  updatedRounds[currentRoundIndex] = {
    ...currentRound,
    matches: updatedMatches,
  };

  return {
    ...championship,
    matchContainer: {
      ...matchContainer,
      rounds: updatedRounds,
      timer: Math.min(90, minute + 1),
    },
  };
}

const runMatchActions = (
  championshipContainer: ChampionshipContainer,
  dependencies: MatchServiceDependencies = {}
): OperationResult<ChampionshipContainer> => {
  try {
    const deps = {
      ...defaultDependencies,
      ...dependencies,
    };

    let updatedContainer: ChampionshipContainer = {
      ...championshipContainer,
      playableChampionship: simulateChampionshipMatches(
        championshipContainer.playableChampionship,
        deps.rng
      ),
    };

    if (championshipContainer.playableChampionship.isPromotable && championshipContainer.promotionChampionship) {
      updatedContainer = {
        ...updatedContainer,
        promotionChampionship: simulateChampionshipMatches(
          championshipContainer.promotionChampionship,
          deps.rng
        ),
      };
    }

    if (
      championshipContainer.playableChampionship.isRelegatable &&
      championshipContainer.relegationChampionship
    ) {
      updatedContainer = {
        ...updatedContainer,
        relegationChampionship: simulateChampionshipMatches(
          championshipContainer.relegationChampionship,
          deps.rng
        ),
      };
    }

    const result = new OperationResult(updatedContainer);
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult({} as ChampionshipContainer);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({ errorCode: 'exception', message });
    return result;
  }
};

export default {
  runMatchActions,
};
