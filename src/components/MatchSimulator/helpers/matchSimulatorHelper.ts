import { ChampionshipState, GeneralState, MatchTeams } from '../../../reducers/types';
import { BaseTeam, Match, MatchTeam, SeasonRound } from '../../../types';
import Functions from '../../../functions/MatchSimulatorFunctions';
import { RunMatchLogicParams } from '../types';

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

export const runMatchLogic = (params: RunMatchLogicParams) => {
  let timer: number | undefined;
  const {
    detailsMatchId,
    teamSquadView,
    time,
    setTime,
    state,
    matches,
    setScorer,
    increaseScore,
    standingsUpdated,
    standingsTimeoutSet,
    updateTableStandings,
    setStandingsUpdated,
    setStandingsTimeoutSet,
    updateTeamMorale,
    setIsRoundOver,
    setScreenDisplayed,
  } = params;

  if (!detailsMatchId && !teamSquadView && time < 90) {
    timer = window.setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, state.clockSpeed);
  }

  if (matches.length > 0 && time < 90) {
    Functions.tickClock(time, matches, setScorer, increaseScore);
  }

  if (time >= 90 || teamSquadView || detailsMatchId) {
    if (timer) clearInterval(timer);
  }

  // After match ends, update standings and show standings after 5 seconds
  if (
    time >= 90 &&
    !teamSquadView &&
    !detailsMatchId &&
    !standingsUpdated &&
    !standingsTimeoutSet
  ) {
    updateTableStandings(matches);
    setStandingsUpdated(true);
    setStandingsTimeoutSet(true);
    window.setTimeout(() => {
      updateTeamMorale(matches);
      setIsRoundOver(true);
      setScreenDisplayed('TeamStandings');
    }, 5000);
  }

  return timer;
};
