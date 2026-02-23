import Match from '../../models/Match';
import MatchSimulationState from '../../models/MatchSimulationState';
import { decideAction } from './DecisionPolicy';
import {
  moveAction,
  passToNextAreaAction,
  passToPreviousAreaAction,
  shootAction,
} from './ActionStrategies';
import { MatchAction, MatchActionStrategy, RandomProvider } from './types';

const ACTION_STRATEGIES: Record<MatchAction, MatchActionStrategy> = {
  move: moveAction,
  'pass-next': passToNextAreaAction,
  'pass-previous': passToPreviousAreaAction,
  shoot: shootAction,
};

function kickoff(match: Match, rng: RandomProvider): MatchSimulationState {
  return {
    hasKickedOff: true,
    possessionTeam: rng.nextInt(0, 100) < 50 ? 'home' : 'away',
    fieldArea: 'midfield',
    shotAttempts: match.simulation?.shotAttempts ?? 0,
  };
}

function ensureSimulationState(match: Match, rng: RandomProvider): MatchSimulationState {
  if (match.simulation?.hasKickedOff) {
    return match.simulation;
  }

  return kickoff(match, rng);
}

export function runMatchTick(match: Match, minute: number, rng: RandomProvider): Match {
  const currentSimulation = ensureSimulationState(match, rng);
  const action = decideAction(currentSimulation.fieldArea, rng);
  const strategy = ACTION_STRATEGIES[action];
  const result = strategy(match, currentSimulation, { minute, rng });

  return {
    ...result.match,
    simulation: result.simulation,
  };
}
