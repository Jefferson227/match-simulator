import { Championship } from '../models/Championship';
import Round from '../models/Round';
import { Team } from '../models/Team';
import OperationResult from '../results/OperationResult';

function getTeamsToSelect(championship: Championship): OperationResult<Team[]> {
  try {
    const result = new OperationResult(championship.teams);
    result.setSuccess();

    return result;
  } catch (error) {
    const result = new OperationResult([] as Team[]);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({ errorCode: 'exception', message });
    return result;
  }
}

function markTeamAsSelectedInAllRounds(rounds: Round[], teamId: string): { rounds: Round[]; hasRoundsChanged: boolean } {
  let hasRoundsChanged = false;
  const updatedRounds = rounds.map((round) => {
    let hasMatchesChanged = false;
    const updatedMatches = round.matches.map((match) => {
      const isHomeTeamSelected = match.homeTeam.id === teamId;
      const isAwayTeamSelected = match.awayTeam.id === teamId;

      if (!isHomeTeamSelected && !isAwayTeamSelected) {
        return match;
      }

      hasMatchesChanged = true;

      return {
        ...match,
        homeTeam: isHomeTeamSelected
          ? { ...match.homeTeam, isControlledByHuman: true }
          : match.homeTeam,
        awayTeam: isAwayTeamSelected
          ? { ...match.awayTeam, isControlledByHuman: true }
          : match.awayTeam,
      };
    });

    if (!hasMatchesChanged) {
      return round;
    }

    hasRoundsChanged = true;
    return {
      ...round,
      matches: updatedMatches,
    };
  });

  return {
    rounds: updatedRounds,
    hasRoundsChanged,
  };
}

function selectTeam(championship: Championship, teamId: string): OperationResult<Championship> {
  try {
    const updatedStartingTeams = championship.teams.map((team: Team) => {
      if (team.id === teamId) {
        return {
          ...team,
          isControlledByHuman: true,
        };
      }

      return team;
    });

    const { rounds: updatedRounds, hasRoundsChanged } = markTeamAsSelectedInAllRounds(
      championship.matchContainer.rounds,
      teamId,
    );

    const updatedMatchContainer = hasRoundsChanged
      ? { ...championship.matchContainer, rounds: updatedRounds }
      : championship.matchContainer;

    const updatedChampionship = {
      ...championship,
      teams: updatedStartingTeams,
      matchContainer: updatedMatchContainer,
    };

    const result = new OperationResult(updatedChampionship);
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult({} as Championship);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({ errorCode: 'exception', message });
    return result;
  }
}

export default {
  getTeamsToSelect,
  selectTeam,
};
