import { ChampionshipPhase, ChampionshipState } from '../reducers/types';
import { GroupTableStandings, SeasonGroupRound, SeasonRound, TableStanding } from '../types';

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
): SeasonGroupRound[] => {
  // Based on the group standings, create one calendar per group with the double-round-robin logic
  // Add the calendars for all groups into a single array
  // Return the array with all calendars
  return [];
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
