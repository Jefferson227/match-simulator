import { ChampionshipPhase, ChampionshipState } from '../reducers/types';
import { GroupTableStandings, SeasonRound } from '../types';

export const mountGroupsForNextPhase = (
  championshipState: ChampionshipState
): GroupTableStandings[] => {
  const sortedStandings = [...championshipState.tableStandings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  if (sortedStandings.length < 8) {
    return [];
  }

  const groupA: GroupTableStandings = {
    groupId: 'A',
    groupName: 'Group A',
    tableStandings: [
      {
        ...sortedStandings[0],
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
      {
        ...sortedStandings[3],
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
      {
        ...sortedStandings[4],
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
      {
        ...sortedStandings[7],
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
    ],
  };

  const groupB: GroupTableStandings = {
    groupId: 'B',
    groupName: 'Group B',
    tableStandings: [
      {
        ...sortedStandings[1],
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
      {
        ...sortedStandings[2],
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
      {
        ...sortedStandings[5],
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
      {
        ...sortedStandings[6],
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
    ],
  };

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
