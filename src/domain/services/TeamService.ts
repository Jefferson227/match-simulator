import { Championship } from '../models/Championship';
import ChampionshipContainer from '../models/ChampionshipContainer';
import Player from '../models/Player';
import Round from '../models/Round';
import { Team } from '../models/Team';
import OperationResult from '../results/OperationResult';
import TeamStatsService from './TeamStatsService';
import { getPlayableChampionship } from '../features/pyramid/Pyramid';
import { pickRandomLineup } from '../features/lineup/RandomLineup';
import { RandomProvider } from '../features/match-simulation/types';
import { getRandomNumber } from '../utils/Utils';

const defaultRng: RandomProvider = { nextInt: getRandomNumber };

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
  try {
    const humanControlledTeam = getPlayableChampionship(championshipContainer).teams.find(
      (team) => team.isControlledByHuman
    );

    const prepareChampionship = (championship: Championship): Championship | undefined => {
      const currentRoundNumber = championship.matchContainer.currentRound;
      const currentRoundIndex = championship.matchContainer.rounds.findIndex(
        (round) => round.number === currentRoundNumber
      );

      if (currentRoundIndex === -1) return undefined;

      const currentRound = championship.matchContainer.rounds[currentRoundIndex];
      const updatedTeamsById = new Map<string, Team>();
      for (let i = 0; i < currentRound.matches.length; i++) {
        const match = currentRound.matches[i];

        if (!updatedTeamsById.has(match.homeTeam.id)) {
          updatedTeamsById.set(
            match.homeTeam.id,
            match.homeTeam.isControlledByHuman && humanControlledTeam
              ? humanControlledTeam
              : pickRandomLineup(match.homeTeam, defaultRng)
          );
        }

        if (!updatedTeamsById.has(match.awayTeam.id)) {
          updatedTeamsById.set(
            match.awayTeam.id,
            match.awayTeam.isControlledByHuman && humanControlledTeam
              ? humanControlledTeam
              : pickRandomLineup(match.awayTeam, defaultRng)
          );
        }
      }

      const updatedTeams = championship.teams.map((team) => updatedTeamsById.get(team.id) ?? team);

      const updatedMatches = currentRound.matches.map((match) => ({
        ...match,
        homeTeam: updatedTeamsById.get(match.homeTeam.id) ?? match.homeTeam,
        awayTeam: updatedTeamsById.get(match.awayTeam.id) ?? match.awayTeam,
      }));

      const updatedRounds = championship.matchContainer.rounds.slice();
      updatedRounds[currentRoundIndex] = {
        ...currentRound,
        matches: updatedMatches,
      };

      return {
        ...championship,
        teams: updatedTeams,
        matchContainer: {
          ...championship.matchContainer,
          rounds: updatedRounds,
        },
      };
    };

    const updatedContainer: ChampionshipContainer = {
      ...championshipContainer,
      championships: championshipContainer.championships.map((championship) => {
        const prepared = prepareChampionship(championship);
        if (prepared) return prepared;

        // An AI division with no round left has nothing to prepare; the playable one always has.
        if (championship.internalName === championshipContainer.playableInternalName) {
          throw new Error('Playable championship is missing.');
        }
        return championship;
      }),
    };

    const result = new OperationResult(updatedContainer);
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult<ChampionshipContainer>({} as ChampionshipContainer);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({ errorCode: 'exception', message });
    return result;
  }
}

function getLastFinishedRound(championship: Championship): Round | undefined {
  const lastFinishedRoundNumber = Math.max(
    1,
    Math.min(championship.matchContainer.currentRound - 1, championship.matchContainer.totalRounds)
  );

  return championship.matchContainer.rounds.find(
    (round) => round.number === lastFinishedRoundNumber
  );
}

function updateChampionshipTeamStats(championship: Championship): Championship {
  const lastFinishedRound = getLastFinishedRound(championship);
  const updatedTeams = championship.teams.map((team) =>
    TeamStatsService.updateTeam(team, {
      latestRound: lastFinishedRound,
      rounds: championship.matchContainer.rounds,
    })
  );
  const updatedTeamsById = new Map(updatedTeams.map((team) => [team.id, team]));
  const updatedRounds = championship.matchContainer.rounds.map((round) => ({
    ...round,
    matches:
      round.status === 'not-started'
        ? round.matches.map((match) => ({
            ...match,
            homeTeam: updatedTeamsById.get(match.homeTeam.id) ?? match.homeTeam,
            awayTeam: updatedTeamsById.get(match.awayTeam.id) ?? match.awayTeam,
          }))
        : round.matches,
  }));

  return {
    ...championship,
    teams: updatedTeams,
    standings: championship.standings.map((standing) => ({
      ...standing,
      team: updatedTeamsById.get(standing.team.id) ?? standing.team,
    })),
    matchContainer: {
      ...championship.matchContainer,
      rounds: updatedRounds,
    },
  };
}

function updateTeamStats(
  championshipContainer: ChampionshipContainer
): OperationResult<ChampionshipContainer> {
  try {
    const updatedContainer: ChampionshipContainer = {
      ...championshipContainer,
      championships: championshipContainer.championships.map(updateChampionshipTeamStats),
    };

    const result = new OperationResult(updatedContainer);
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult<ChampionshipContainer>({} as ChampionshipContainer);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({ errorCode: 'exception', message });
    return result;
  }
}

export default {
  getTeamsToSelect,
  selectTeam,
  updateTeamStats,
  setStartersAndSubs,
  prepareTeamsBeforeMatch,
};
