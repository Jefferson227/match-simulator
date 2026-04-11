import Round from '../models/Round';
import { Team } from '../models/Team';
import PlayerProgressionService from './PlayerProgressionService';

type UpdateTeamContext = {
  latestRound?: Round;
  rounds?: Round[];
  randomProvider?: () => number;
};

function getTeamResult(team: Team, round?: Round): 'win' | 'draw' | 'loss' | null {
  if (!round) return null;

  const match = round.matches.find(
    (currentMatch) => currentMatch.homeTeam.id === team.id || currentMatch.awayTeam.id === team.id
  );
  if (!match) return null;

  const isHomeTeam = match.homeTeam.id === team.id;
  const teamScore = isHomeTeam ? match.homeTeamScore : match.awayTeamScore;
  const opponentScore = isHomeTeam ? match.awayTeamScore : match.homeTeamScore;

  if (teamScore > opponentScore) return 'win';
  if (teamScore < opponentScore) return 'loss';
  return 'draw';
}

function clampMorale(morale: number): number {
  return Math.max(0, Math.min(100, morale));
}

function updateTeamMorale(team: Team, round?: Round): Team {
  const result = getTeamResult(team, round);
  if (!result) return team;

  let moraleChange = 0;

  if (team.morale <= 33) {
    if (result === 'loss') moraleChange = -1;
    if (result === 'win') moraleChange = 2;
  } else if (team.morale < 66) {
    if (result === 'loss') moraleChange = -2;
    if (result === 'draw') moraleChange = 1;
    if (result === 'win') moraleChange = 3;
  } else {
    if (result === 'loss') moraleChange = -2;
    if (result === 'draw') moraleChange = 0.5;
    if (result === 'win') moraleChange = 1;
  }

  return {
    ...team,
    morale: clampMorale(team.morale + moraleChange),
  };
}

function updateTeam(team: Team, context: UpdateTeamContext = {}): Team {
  const updatedTeam = updateTeamMorale(team, context.latestRound);

  return {
    ...updatedTeam,
    players: PlayerProgressionService.updatePlayers(
      updatedTeam.players,
      updatedTeam.morale,
      team,
      context.rounds,
      context.randomProvider
    ),
  };
}

export default {
  getTeamResult,
  clampMorale,
  updateTeamMorale,
  updateTeam,
};
