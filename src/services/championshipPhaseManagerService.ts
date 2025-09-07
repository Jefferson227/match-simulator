import { ChampionshipFormat, ChampionshipPhase, ChampionshipState } from '../reducers/types';
import { GroupTableStandings, SeasonRound } from '../types';

export const mountGroupsForNextPhase = (
  championshipState: ChampionshipState
): GroupTableStandings[] => {
  // Take the 1st, 4th, 5th, and 8th teams as the group A
  // Take the 2nd, 3rd, 6th, and 7th teams as the group B
  // Mount groups
  // Return groups
  return [];
};

export const setSeasonCalendarForNextPhase = (
  groupStandings: GroupTableStandings[]
): SeasonRound[] => {
  // Set the season calendar for both groups from the parameter
  // Return the new calendar
  return [];
};

export const moveToNextPhase = (championshipState: ChampionshipState): ChampionshipPhase => {
  // Get the championship format
  // Get the current phase
  // If championshipFormat doesn't have a ";" return the championshipPhase
  // If championshipFormat has a ";" identify the current phase based on the championshipFormat
  // Return the next phase
  return 'quadrangular';
};
