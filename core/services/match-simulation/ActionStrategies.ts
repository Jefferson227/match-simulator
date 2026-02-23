import Match from '../../models/Match';
import MatchSimulationState from '../../models/MatchSimulationState';
import PossessionTeam from '../../enums/PossessionTeam';
import { Team } from '../../models/Team';
import {
  getDefenseStrengthForDispute,
  getNextFieldArea,
  getOpposingFieldArea,
  getPlayerPositionFromFieldArea,
  getPreviousFieldArea,
  getShooterCandidates,
  getShooterStrengthForDispute,
  getTeamStrengthForDispute,
} from './StrengthResolver';
import { MatchActionContext, MatchActionResult, MatchActionStrategy } from './types';

function getTeamByPossession(match: Match, possessionTeam: PossessionTeam): Team {
  return possessionTeam === 'home' ? match.homeTeam : match.awayTeam;
}

function switchPossession(possessionTeam: PossessionTeam): PossessionTeam {
  return possessionTeam === 'home' ? 'away' : 'home';
}

function resolveDispute(
  offenseStrengthMax: number,
  defenseStrengthMax: number,
  context: MatchActionContext
): boolean {
  const offenseRoll = context.rng.nextInt(1, Math.max(1, offenseStrengthMax));
  const defenseRoll = context.rng.nextInt(1, Math.max(1, defenseStrengthMax));
  return offenseRoll >= defenseRoll;
}

export const moveAction: MatchActionStrategy = (
  match: Match,
  simulation: MatchSimulationState,
  context: MatchActionContext
): MatchActionResult => {
  const teamWithBall = getTeamByPossession(match, simulation.possessionTeam);
  const opposingTeam = getTeamByPossession(match, switchPossession(simulation.possessionTeam));
  const opposingFieldArea = getOpposingFieldArea(simulation.fieldArea);

  const offenseStrengthMax = getTeamStrengthForDispute(
    teamWithBall,
    getPlayerPositionFromFieldArea(simulation.fieldArea)
  );
  const defenseStrengthMax = getTeamStrengthForDispute(
    opposingTeam,
    getPlayerPositionFromFieldArea(opposingFieldArea)
  );

  const offenseWinsDispute = resolveDispute(offenseStrengthMax, defenseStrengthMax, context);
  if (offenseWinsDispute) {
    return { match, simulation };
  }

  return {
    match,
    simulation: {
      ...simulation,
      possessionTeam: switchPossession(simulation.possessionTeam),
      fieldArea: opposingFieldArea,
    },
  };
};

export const passToNextAreaAction: MatchActionStrategy = (
  match: Match,
  simulation: MatchSimulationState,
  context: MatchActionContext
): MatchActionResult => {
  const teamWithBall = getTeamByPossession(match, simulation.possessionTeam);
  const opposingTeam = getTeamByPossession(match, switchPossession(simulation.possessionTeam));
  const opposingFieldArea = getOpposingFieldArea(simulation.fieldArea);

  const offenseStrengthMax = getTeamStrengthForDispute(
    teamWithBall,
    getPlayerPositionFromFieldArea(simulation.fieldArea)
  );
  const defenseStrengthMax = getTeamStrengthForDispute(
    opposingTeam,
    getPlayerPositionFromFieldArea(opposingFieldArea)
  );

  const offenseWinsDispute = resolveDispute(offenseStrengthMax, defenseStrengthMax, context);
  if (offenseWinsDispute) {
    return {
      match,
      simulation: {
        ...simulation,
        fieldArea: getNextFieldArea(simulation.fieldArea),
      },
    };
  }

  return {
    match,
    simulation: {
      ...simulation,
      possessionTeam: switchPossession(simulation.possessionTeam),
      fieldArea: opposingFieldArea,
    },
  };
};

export const passToPreviousAreaAction: MatchActionStrategy = (
  match: Match,
  simulation: MatchSimulationState,
  context: MatchActionContext
): MatchActionResult => {
  const teamWithBall = getTeamByPossession(match, simulation.possessionTeam);
  const opposingTeam = getTeamByPossession(match, switchPossession(simulation.possessionTeam));
  const opposingFieldArea = getOpposingFieldArea(simulation.fieldArea);

  const offenseStrengthMax = getTeamStrengthForDispute(
    teamWithBall,
    getPlayerPositionFromFieldArea(simulation.fieldArea)
  );
  const defenseStrengthMax = getTeamStrengthForDispute(
    opposingTeam,
    getPlayerPositionFromFieldArea(opposingFieldArea)
  );

  const offenseWinsDispute = resolveDispute(offenseStrengthMax, defenseStrengthMax, context);
  if (offenseWinsDispute) {
    return {
      match,
      simulation: {
        ...simulation,
        fieldArea: getPreviousFieldArea(simulation.fieldArea),
      },
    };
  }

  return {
    match,
    simulation: {
      ...simulation,
      possessionTeam: switchPossession(simulation.possessionTeam),
      fieldArea: opposingFieldArea,
    },
  };
};

export const shootAction: MatchActionStrategy = (
  match: Match,
  simulation: MatchSimulationState,
  context: MatchActionContext
): MatchActionResult => {
  const teamWithBall = getTeamByPossession(match, simulation.possessionTeam);
  const opposingTeam = getTeamByPossession(match, switchPossession(simulation.possessionTeam));
  const shooters = getShooterCandidates(teamWithBall, simulation.fieldArea);
  const shooterIndex = context.rng.nextInt(0, Math.max(0, shooters.length - 1));
  const shooter = shooters[shooterIndex];

  const shooterStrengthMax = getShooterStrengthForDispute(shooter, teamWithBall);
  const defenseStrengthMax = getDefenseStrengthForDispute(opposingTeam);
  const scorerTeam = simulation.possessionTeam;
  const doesScore = resolveDispute(shooterStrengthMax, defenseStrengthMax, context);

  if (!doesScore) {
    return {
      match,
      simulation: {
        ...simulation,
        possessionTeam: switchPossession(simulation.possessionTeam),
        fieldArea: getOpposingFieldArea(simulation.fieldArea),
        shotAttempts: simulation.shotAttempts + 1,
      },
    };
  }

  const updatedMatch = {
    ...match,
    homeTeamScore: scorerTeam === 'home' ? match.homeTeamScore + 1 : match.homeTeamScore,
    awayTeamScore: scorerTeam === 'away' ? match.awayTeamScore + 1 : match.awayTeamScore,
    scorers: [
      ...match.scorers,
      {
        player: shooter,
        scorerTeam,
        time: context.minute,
      },
    ],
    latestGoal: {
      scorerName: shooter.name,
    },
  };

  return {
    match: updatedMatch,
    simulation: {
      hasKickedOff: true,
      possessionTeam: switchPossession(simulation.possessionTeam),
      fieldArea: 'midfield',
      shotAttempts: simulation.shotAttempts + 1,
    },
  };
};
