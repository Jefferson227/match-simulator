import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import { Championship } from '../models/Championship';
import { runMatchTick } from '../features/match-simulation/MatchSimulationEngine';
import { RandomProvider } from '../features/match-simulation/types';
import { getRandomNumber } from '../utils/Utils';
import { updatePlayableChampionship } from '../features/pyramid/Pyramid';

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

    // Only the playable division is ticked. The AI divisions are played a whole round at a time
    // by `ChampionshipService.endRoundForAllChampionships`, so ticking them here would only replay
    // minutes they are about to simulate for themselves.
    const updatedContainer = updatePlayableChampionship(championshipContainer, (playable) =>
      simulateChampionshipMatches(playable, deps.rng)
    );

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
