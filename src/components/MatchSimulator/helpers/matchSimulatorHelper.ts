import { ChampionshipState, GeneralState, MatchTeams } from '../../../reducers/types';
import { BaseTeam, Match, MatchTeam, SeasonRound } from '../../../types';

export const setUpMatches = (
  championshipState: ChampionshipState,
  state: GeneralState,
  matches: Match[],
  getCurrentRoundMatches: (
    teamsControlledAutomatically: BaseTeam[],
    seasonCalendar: SeasonRound[],
    currentRound: number,
    humanPlayerTeam: BaseTeam,
    humanPlayerMatchTeam?: MatchTeam
  ) => MatchTeams[],
  setMatches: (matches: MatchTeams[]) => void
) => {
  // Only set matches if not already set for this round
  if (
    championshipState.seasonMatchCalendar.length > 0 &&
    championshipState.humanPlayerBaseTeam &&
    (matches.length === 0 || matches[0]?.round !== championshipState.currentRound)
  ) {
    const currentRoundMatches = getCurrentRoundMatches(
      championshipState.teamsControlledAutomatically,
      championshipState.seasonMatchCalendar,
      championshipState.currentRound,
      championshipState.humanPlayerBaseTeam,
      state.matchTeam || undefined
    );

    // Transform to the format expected by MatchSimulator
    const transformedMatches = currentRoundMatches.map((match) => ({
      id: crypto.randomUUID(),
      homeTeam: match.homeTeam,
      visitorTeam: match.visitorTeam,
      lastScorer: null,
      ballPossession: {
        isHomeTeam: true,
        position: 'midfield' as const,
      },
      shotAttempts: 0,
      scorers: [],
      round: championshipState.currentRound, // Add round info
    }));

    setMatches(transformedMatches);
  }
  // eslint-disable-next-line
};
