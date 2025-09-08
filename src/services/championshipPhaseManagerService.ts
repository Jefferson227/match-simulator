import { ChampionshipPhase, ChampionshipState } from '../reducers/types';
import { GroupTableStandings, SeasonRound, TableStanding } from '../types';

function getSortedStandings(tableStandings: TableStanding[]) {
  const sortedStandings = [...tableStandings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  if (sortedStandings.length < 8) {
    return [];
  }

  return sortedStandings;
}

function resetStandings(standings: TableStanding[]) {
  return standings.map((standing) => {
    return {
      ...standing,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });
}

function mountGroup(groupName: string, teamStandings: TableStanding[]) {
  const newStandings = resetStandings(teamStandings);
  return {
    groupId: crypto.randomUUID(),
    groupName,
    tableStandings: [...newStandings],
  };
}

export const mountGroupsForNextPhase = (
  championshipState: ChampionshipState
): GroupTableStandings[] => {
  const sortedStandings = getSortedStandings(championshipState.tableStandings);

  const groupATeams = [
    sortedStandings[0],
    sortedStandings[3],
    sortedStandings[4],
    sortedStandings[7],
  ];
  const groupA = mountGroup('Group A', groupATeams);

  const groupBTeams = [
    sortedStandings[1],
    sortedStandings[2],
    sortedStandings[5],
    sortedStandings[6],
  ];
  const groupB = mountGroup('Group B', groupBTeams);

  return [groupA, groupB];
};

export const setSeasonCalendarForNextPhase = (
  groupStandings: GroupTableStandings[]
): SeasonRound[] => {
  const seasonRounds: SeasonRound[] = [];
  let roundNumber = 1;

  groupStandings.forEach((group) => {
    const teams = group.tableStandings.map((standing) => ({
      id: standing.teamId,
      name: standing.teamName,
      shortName: standing.teamName,
      abbreviation: standing.teamAbbreviation,
      colors: { outline: '#000', background: '#fff', name: '#000' },
      players: [],
      morale: 50,
      formation: '4-4-2',
      overallMood: 100,
      initialOverallStrength: 80,
    }));

    const teamsCount = teams.length;
    const matchesPerRound = teamsCount / 2;
    const totalRounds = (teamsCount - 1) * 2;

    for (let round = 1; round <= totalRounds; round++) {
      const existingRound = seasonRounds.find((r) => r.roundNumber === roundNumber);
      const roundMatches = existingRound ? [...existingRound.matches] : [];

      for (let i = 0; i < matchesPerRound; i++) {
        const homeTeamIndex = i;
        const awayTeamIndex = teamsCount - 1 - i;

        if (homeTeamIndex !== awayTeamIndex) {
          const homeTeam = teams[homeTeamIndex];
          const awayTeam = teams[awayTeamIndex];

          roundMatches.push({
            id: crypto.randomUUID(),
            round: roundNumber,
            homeTeam,
            awayTeam,
            isPlayed: false,
          });
        }
      }

      if (existingRound) {
        existingRound.matches = roundMatches;
      } else {
        seasonRounds.push({
          roundNumber,
          matches: roundMatches,
        });
      }

      if (round < totalRounds) {
        const teamsToRotate = teams.slice(1);
        const lastTeam = teamsToRotate.pop();
        if (lastTeam) {
          teamsToRotate.unshift(lastTeam);
        }
        teams.splice(1, teams.length - 1, ...teamsToRotate);
      }

      roundNumber++;
    }
  });

  return seasonRounds.sort((a, b) => a.roundNumber - b.roundNumber);
};

export const moveToNextPhase = (championshipState: ChampionshipState): ChampionshipPhase => {
  const { format: championshipFormat, phase: currentPhase } = championshipState;

  if (!championshipFormat.includes(';')) {
    return currentPhase;
  }

  const phases = championshipFormat.split(';') as ChampionshipPhase[];
  const currentPhaseIndex = phases.indexOf(currentPhase);

  if (currentPhaseIndex === -1 || currentPhaseIndex >= phases.length - 1) {
    return currentPhase;
  }

  return phases[currentPhaseIndex + 1];
};
