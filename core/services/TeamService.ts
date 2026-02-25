import { Championship } from '../models/Championship';
import ChampionshipContainer from '../models/ChampionshipContainer';
import Player from '../models/Player';
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

function markTeamAsSelectedInAllRounds(
  rounds: Round[],
  teamId: string
): { rounds: Round[]; hasRoundsChanged: boolean } {
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
      teamId
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

function setStartersAndSubs(
  teamId: string,
  starters: Player[],
  subs: Player[],
  teams: Team[]
): OperationResult<Team> {
  try {
    const starterIds = starters.map((starter) => starter.id);
    const subIds = subs.map((sub) => sub.id);

    let teamIndex = -1;
    for (let i = 0; i < teams.length; i++) {
      if (teams[i].id === teamId) {
        teamIndex = i;
        break;
      }
    }

    if (teamIndex === -1) {
      throw new Error('Team not found while setting starters and subs.');
    }

    const team = teams[teamIndex];
    const updatedPlayers = team.players.map((player) => {
      if (starterIds.includes(player.id))
        return {
          ...player,
          isStarter: true,
          isSub: false,
        };

      if (subIds.includes(player.id))
        return {
          ...player,
          isStarter: false,
          isSub: true,
        };

      return {
        ...player,
        isStarter: false,
        isSub: false,
      };
    });

    const updatedTeam = {
      ...team,
      players: updatedPlayers,
    };

    const result = new OperationResult<Team>(updatedTeam);
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult({} as Team);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({ errorCode: 'exception', message });
    return result;
  }
}

function prepareTeamsBeforeMatch(
  championshipContainer: ChampionshipContainer
): OperationResult<ChampionshipContainer> {
  // TODO: Get teams from each championship (not considering those controlled by human players) for current round, and assign a random formation by setting the players as starters or subs respecting the quantity of 11 players (1 GK and 10 in other positions), and a max of 6 subs
  const result = new OperationResult<ChampionshipContainer>({} as ChampionshipContainer);
  result.setError({ errorCode: 'implementation-missing', message: 'Implementation missing.' });
  return result;
}

export default {
  getTeamsToSelect,
  selectTeam,
  setStartersAndSubs,
};
