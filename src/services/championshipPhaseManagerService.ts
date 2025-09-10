import { ChampionshipPhase, ChampionshipState } from '../reducers/types';
import {
  GroupTableStandings,
  SeasonGroupRound,
  SeasonRound,
  TableStanding,
  SeasonMatch,
  BaseTeam,
} from '../types';

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
  groupStandings: GroupTableStandings[],
  championshipState: ChampionshipState
): SeasonGroupRound[] => {
  // Based on the group standings, create one calendar per group with the double-round-robin logic
  // Add the calendars for all groups into a single array
  // Return the array with all calendars

  return groupStandings.map((group) => {
    // Get teams from championshipState instead of creating from tableStandings
    const allTeams = [
      ...championshipState.teamsControlledAutomatically,
      championshipState.humanPlayerBaseTeam,
    ];

    const teams: BaseTeam[] = group.tableStandings
      .map((standing) => allTeams.find((team) => team.id === standing.teamId))
      .filter((team): team is BaseTeam => team !== undefined);

    // Shuffle teams for balanced scheduling
    const shuffledTeams = [...teams];
    for (let i = shuffledTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
    }

    const totalTeams = teams.length;
    const coeff = 2; // Double round-robin
    const totalRounds = totalTeams * coeff - coeff;
    const matchesPerRound = totalTeams / 2;

    const rounds: SeasonRound[] = [];

    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches: SeasonMatch[] = [];

      // Generate matches for this round using round-robin algorithm
      for (let i = 0; i < matchesPerRound; i++) {
        const homeTeamIndex = i;
        const awayTeamIndex = totalTeams - 1 - i;

        if (homeTeamIndex !== awayTeamIndex) {
          const homeTeam = shuffledTeams[homeTeamIndex];
          const awayTeam = shuffledTeams[awayTeamIndex];

          const match: SeasonMatch = {
            id: crypto.randomUUID(),
            round: round,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            isPlayed: false,
          };

          roundMatches.push(match);
        }
      }

      rounds.push({
        roundNumber: round,
        matches: roundMatches,
      });

      // Rotate teams for the next round (except the first team)
      if (round < totalRounds) {
        const teamsToRotate = shuffledTeams.slice(1);
        const lastTeam = teamsToRotate.pop();
        if (lastTeam) {
          teamsToRotate.unshift(lastTeam);
        }
        shuffledTeams.splice(1, shuffledTeams.length - 1, ...teamsToRotate);
      }
    }

    return {
      group: group,
      rounds: rounds,
    };
  });
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
