import { FORMATIONS } from '../enums/Formations';
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
  try {
    const formationRequirements = FORMATIONS.map((formation) => {
      const [defenders, midfielders, forwards] = formation.split('-').map(Number);
      return { formation, defenders, midfielders, forwards };
    });

    const pickRandomPlayers = (players: Player[], count: number): Player[] => {
      if (count <= 0 || players.length === 0) return [];

      const pickedCount = Math.min(count, players.length);
      const cloned = players.slice();

      for (let i = 0; i < pickedCount; i++) {
        const randomIndex = i + Math.floor(Math.random() * (cloned.length - i));
        const temp = cloned[i];
        cloned[i] = cloned[randomIndex];
        cloned[randomIndex] = temp;
      }

      return cloned.slice(0, pickedCount);
    };

    const buildRandomLineup = (team: Team): Team => {
      const goalkeepers: Player[] = [];
      const defenders: Player[] = [];
      const midfielders: Player[] = [];
      const forwards: Player[] = [];

      for (let i = 0; i < team.players.length; i++) {
        const player = team.players[i];
        if (player.position === 'GK') {
          goalkeepers.push(player);
        } else if (player.position === 'DF') {
          defenders.push(player);
        } else if (player.position === 'MF') {
          midfielders.push(player);
        } else if (player.position === 'FW') {
          forwards.push(player);
        }
      }

      const availableFormations = formationRequirements.filter(
        (formation) =>
          goalkeepers.length >= 1 &&
          defenders.length >= formation.defenders &&
          midfielders.length >= formation.midfielders &&
          forwards.length >= formation.forwards
      );

      const starterIds = new Set<string>();
      if (availableFormations.length > 0) {
        const selectedFormation =
          availableFormations[Math.floor(Math.random() * availableFormations.length)];

        pickRandomPlayers(goalkeepers, 1).forEach((player) => starterIds.add(player.id));
        pickRandomPlayers(defenders, selectedFormation.defenders).forEach((player) =>
          starterIds.add(player.id)
        );
        pickRandomPlayers(midfielders, selectedFormation.midfielders).forEach((player) =>
          starterIds.add(player.id)
        );
        pickRandomPlayers(forwards, selectedFormation.forwards).forEach((player) =>
          starterIds.add(player.id)
        );
      } else {
        const gkStarter = pickRandomPlayers(goalkeepers, 1);
        const gkStarterIds = new Set(gkStarter.map((player) => player.id));

        const availableOutfieldPlayers = team.players.filter(
          (player) => player.position !== 'GK' && !gkStarterIds.has(player.id)
        );
        const outfieldStarters = pickRandomPlayers(availableOutfieldPlayers, 10);

        gkStarter.forEach((player) => starterIds.add(player.id));
        outfieldStarters.forEach((player) => starterIds.add(player.id));
      }

      if (starterIds.size === 0) {
        const fallbackStarters = pickRandomPlayers(team.players, 11);
        fallbackStarters.forEach((player) => starterIds.add(player.id));
      }

      const availableSubs = team.players.filter((player) => !starterIds.has(player.id));
      const subs = pickRandomPlayers(availableSubs, 6);
      const subIds = new Set(subs.map((player) => player.id));

      return {
        ...team,
        players: team.players.map((player) => ({
          ...player,
          isStarter: starterIds.has(player.id),
          isSub: subIds.has(player.id),
        })),
      };
    };

    const prepareChampionship = (championship?: Championship): Championship | undefined => {
      if (!championship) return championship;

      const humanControlledTeam = championshipContainer.playableChampionship.teams.find(
        (team) => team.isControlledByHuman
      );
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
              : buildRandomLineup(match.homeTeam)
          );
        }

        if (!updatedTeamsById.has(match.awayTeam.id)) {
          updatedTeamsById.set(
            match.awayTeam.id,
            match.awayTeam.isControlledByHuman && humanControlledTeam
              ? humanControlledTeam
              : buildRandomLineup(match.awayTeam)
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

    const updatedPlayableChampionship = prepareChampionship(
      championshipContainer.playableChampionship
    );
    if (!updatedPlayableChampionship) {
      throw new Error('Playable championship is missing.');
    }

    const updatedContainer: ChampionshipContainer = {
      ...championshipContainer,
      playableChampionship: updatedPlayableChampionship,
      promotionChampionship: prepareChampionship(championshipContainer.promotionChampionship),
      relegationChampionship: prepareChampionship(championshipContainer.relegationChampionship),
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
    Math.min(
      championship.matchContainer.currentRound - 1,
      championship.matchContainer.totalRounds
    )
  );

  return championship.matchContainer.rounds.find(
    (round) => round.number === lastFinishedRoundNumber
  );
}

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

function updateChampionshipTeamStats(championship?: Championship): Championship | undefined {
  if (!championship) return championship;

  const lastFinishedRound = getLastFinishedRound(championship);
  const updatedTeams = championship.teams.map((team) => updateTeamMorale(team, lastFinishedRound));
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
      playableChampionship: updateChampionshipTeamStats(
        championshipContainer.playableChampionship
      ) as Championship,
      promotionChampionship: updateChampionshipTeamStats(championshipContainer.promotionChampionship),
      relegationChampionship: updateChampionshipTeamStats(
        championshipContainer.relegationChampionship
      ),
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
