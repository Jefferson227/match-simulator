import Match from '../../models/Match';
import MatchSimulationState from '../../models/MatchSimulationState';
import { decideAction } from './DecisionPolicy';
import {
  moveAction,
  passToNextAreaAction,
  passToPreviousAreaAction,
  shootAction,
} from './ActionStrategies';
import { Team } from '../../models/Team';
import { FULL_STAMINA, getStaminaAtMinute } from './StaminaPolicy';
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

// Only the players the dispute resolver will actually read tire. That is the
// starters, or the whole squad when none is flagged — the same fallback
// `getStarters` applies, so the pitch and the tiring set cannot diverge.
function applyStaminaForMinute(team: Team, minute: number): Team {
  const hasStarters = team.players.some((player) => player.isStarter);

  return {
    ...team,
    players: team.players.map((player) => {
      const isOnPitch = hasStarters ? player.isStarter : true;

      return {
        ...player,
        stamina: isOnPitch ? getStaminaAtMinute(player.age, minute) : FULL_STAMINA,
      };
    }),
  };
}

export function runMatchTick(match: Match, minute: number, rng: RandomProvider): Match {
  const currentSimulation = ensureSimulationState(match, rng);
  // Recomputed from the minute every tick, so kickoff needs no reset of its own:
  // at minute 0 every band still floors to a full 100.
  const matchWithStamina: Match = {
    ...match,
    homeTeam: applyStaminaForMinute(match.homeTeam, minute),
    awayTeam: applyStaminaForMinute(match.awayTeam, minute),
  };
  const action = decideAction(currentSimulation.fieldArea, rng);
  const strategy = ACTION_STRATEGIES[action];
  const result = strategy(matchWithStamina, currentSimulation, { minute, rng });

  return {
    ...result.match,
    simulation: result.simulation,
  };
}
