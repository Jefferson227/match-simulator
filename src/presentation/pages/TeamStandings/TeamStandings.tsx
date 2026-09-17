import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Standing from '../../../domain/models/Standing';
import { PhaseView } from '../../../domain/features/phases/PhaseView';
import MainLayout from '../../components/MainLayout/MainLayout';
import PhaseBracket from '../../components/PhaseBracket/PhaseBracket';
import ChampionshipUseCases from '../../../use-cases/ChampionshipUseCases';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';

const RESULTS_PER_PAGE = 12;
const TIES_PER_PAGE = 4;

interface TeamStandingsProps {
  standings?: Standing[];
}

const TeamStandings: React.FC<TeamStandingsProps> = ({ standings: propStandings }) => {
  const engine = useGameEngine();
  const state = useGameState(engine);
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [isShowingNextPhase, setIsShowingNextPhase] = useState(false);

  const championship = useMemo(
    () => new ChampionshipUseCases(state).getPlayableChampionship(),
    [state]
  );

  // A phase view is only built for the live championship — a caller that passes `standings`
  // explicitly is rendering a plain table and wants nothing else. The screen first shows the results
  // of the round last played: once the last round of a phase ends, the current round already opens
  // the next one, whose draw is shown on continuing.
  const { resultsView, nextPhaseView } = useMemo<{
    resultsView: PhaseView;
    nextPhaseView: PhaseView;
  }>(() => {
    if (propStandings !== undefined) {
      const plain: PhaseView = { isPhased: false, phaseIndex: 0 };
      return { resultsView: plain, nextPhaseView: plain };
    }

    const championshipUseCases = new ChampionshipUseCases(state);
    return {
      resultsView: championshipUseCases.getPhaseView(championship, { focus: 'last-ended-round' }),
      nextPhaseView: championshipUseCases.getPhaseView(championship, { focus: 'current-round' }),
    };
  }, [championship, propStandings, state]);

  const hasNextPhase =
    resultsView.isPhased &&
    nextPhaseView.isPhased &&
    nextPhaseView.phaseIndex !== resultsView.phaseIndex;
  const phaseView = isShowingNextPhase ? nextPhaseView : resultsView;

  const groups = phaseView.groups ?? [];
  const ties = phaseView.ties ?? [];
  const isGroupStage = groups.length > 1;
  const isKnockout = ties.length > 0;

  const standings = useMemo<Standing[]>(() => {
    if (propStandings !== undefined) return propStandings;
    if (phaseView.standings) return phaseView.standings;
    if (!championship?.standings?.length) return [];

    return championship.standings;
  }, [championship, phaseView, propStandings]);

  // A group stage pages one group at a time; a knockout pages through its ties.
  const totalPages = isGroupStage
    ? Math.max(1, groups.length)
    : isKnockout
      ? Math.max(1, Math.ceil(ties.length / TIES_PER_PAGE))
      : Math.max(1, Math.ceil(standings.length / RESULTS_PER_PAGE));

  // The human's own group, or own tie, is what they came to read, so a group stage opens on their
  // group and a knockout on the page holding their tie instead of always on the first one. Picked
  // once per phase shown, so paging after that is the player's; the next phase's draw picks again.
  const humanTeamId = championship?.teams?.find((team) => team.isControlledByHuman)?.id;
  const humanPage = useMemo(() => {
    if (!humanTeamId) return -1;

    if (isGroupStage) {
      return groups.findIndex((group) =>
        group.standings.some((row) => row.team.id === humanTeamId)
      );
    }

    if (isKnockout) {
      const tieIndex = ties.findIndex(
        (tie) => tie.homeTeam.id === humanTeamId || tie.awayTeam.id === humanTeamId
      );
      return tieIndex < 0 ? -1 : Math.floor(tieIndex / TIES_PER_PAGE);
    }

    return -1;
  }, [groups, humanTeamId, isGroupStage, isKnockout, ties]);

  const pickedPageFor = useRef<string | null>(null);
  useEffect(() => {
    if (humanPage < 0) return;

    const phaseKey = `${isShowingNextPhase}-${phaseView.phaseIndex}`;
    if (pickedPageFor.current === phaseKey) return;

    pickedPageFor.current = phaseKey;
    setPage(humanPage);
  }, [humanPage, isShowingNextPhase, phaseView.phaseIndex]);

  const currentGroup = isGroupStage ? groups[Math.min(page, groups.length - 1)] : undefined;
  const paginatedStandings = isGroupStage
    ? (currentGroup?.standings ?? [])
    : standings.slice(page * RESULTS_PER_PAGE, (page + 1) * RESULTS_PER_PAGE);
  const paginatedTies = ties.slice(page * TIES_PER_PAGE, (page + 1) * TIES_PER_PAGE);

  const totalRounds = championship?.matchContainer?.totalRounds ?? 0;
  const currentRound = championship?.matchContainer?.currentRound ?? 1;
  const completedRound = Math.min(Math.max(currentRound - 1, 1), totalRounds || 1);
  const displayedRound = isShowingNextPhase ? currentRound : completedRound;
  const isSeasonComplete = totalRounds > 0 && currentRound > totalRounds;

  // A knockout the human's club is not in has nothing to manage: the round is watched, not played,
  // so TeamManager is skipped and the simulator opened straight from the results.
  const skipsTeamManager = useMemo(() => {
    if (isSeasonComplete || nextPhaseView.kind !== 'knockout') return false;

    const nextTies = nextPhaseView.ties ?? [];
    if (!nextTies.length) return false;

    const humanTeamId = championship?.teams?.find((team) => team.isControlledByHuman)?.id;
    if (!humanTeamId) return false;

    return !nextTies.some(
      (tie) => tie.homeTeam.id === humanTeamId || tie.awayTeam.id === humanTeamId
    );
  }, [championship, isSeasonComplete, nextPhaseView]);

  const handlePrevPage = () => {
    if (page > 0) setPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage((prev) => prev + 1);
  };

  const handleContinue = () => {
    if (hasNextPhase && !isShowingNextPhase) {
      setIsShowingNextPhase(true);
      setPage(0);
      return;
    }

    // The season is not rolled over here: the summary has to be built off the tables as they ended,
    // and the roll-over throws them away. SeasonSummary runs it on NEW SEASON.
    if (isSeasonComplete) {
      engine.dispatch({ type: 'BUILD_SEASON_SUMMARY' });
      engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'SeasonSummary' });
      engine.dispatch({ type: 'SAVE_GAME' });
      return;
    }

    engine.dispatch({ type: 'UPDATE_TEAM_STATS' });

    if (skipsTeamManager) {
      // What TeamManager would have done on START MATCH, minus the human lineup nobody needs here.
      engine.dispatch({ type: 'PREPARE_TEAMS_BEFORE_MATCH' });
      engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'MatchSimulator' });
    } else {
      engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamManager' });
    }

    engine.dispatch({ type: 'SAVE_GAME' });
  };

  return (
    <MainLayout>
      <div className="font-press-start min-h-screen flex flex-col items-center">
        <div className="w-[350px] mx-auto text-center">
          <div className="text-[14px] text-white mt-6 mb-2 tracking-wider uppercase">
            {championship?.name ?? 'Standings'}
          </div>
          <div className="text-[12px] text-white mb-2 uppercase">
            {phaseView.isPhased && (
              <>
                {championship?.matchContainer?.currentSeason} - {phaseView.phaseName}
                {currentGroup !== undefined
                  ? ` - ${t('standings.group', { number: currentGroup.group + 1 })}`
                  : ''}
              </>
            )}
            {!phaseView.isPhased && !isSeasonComplete && totalRounds > 0 && (
              <>
                {championship?.matchContainer?.currentSeason} - Round {displayedRound} of{' '}
                {totalRounds}
              </>
            )}
            {isSeasonComplete && (
              <span className="block text-[12px] text-yellow-300">SEASON COMPLETE!</span>
            )}
          </div>
        </div>

        <div
          className="w-[350px] h-[610px] mx-auto mt-0 mb-0 flex flex-col items-center"
          style={{ backgroundColor: '#397a33', border: '4px solid #e2e2e2' }}
        >
          <div className="w-full h-[587px] mt-[14px] overflow-hidden">
            {isKnockout ? (
              <PhaseBracket ties={paginatedTies} />
            ) : (
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-[15px] text-white">
                    <th className="font-normal w-[56px] text-center"> </th>
                    <th className="font-normal w-[56px] text-center"> </th>
                    <th className="font-normal w-[56px] text-center">W</th>
                    <th className="font-normal w-[56px] text-center">D</th>
                    <th className="font-normal w-[56px] text-center">L</th>
                    <th className="font-normal w-[56px] text-center pr-3">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStandings.map((row, idx) => (
                    <React.Fragment key={row.team.id}>
                      <tr className="text-[15px] text-white">
                        <td className="w-[56px] text-center py-2">
                          {isGroupStage ? idx + 1 : page * RESULTS_PER_PAGE + idx + 1}
                        </td>
                        <td className="w-[56px] text-center py-2">
                          <div
                            className="inline-flex min-w-[72px] justify-center border-[3px] px-2 py-1"
                            style={{
                              borderColor: row.team.colors.outline,
                              backgroundColor: row.team.colors.background,
                              color: row.team.colors.text,
                            }}
                          >
                            {row.team.abbreviation}
                          </div>
                        </td>
                        <td className="w-[56px] text-center">{row.wins}</td>
                        <td className="w-[56px] text-center">{row.draws}</td>
                        <td className="w-[56px] text-center">{row.losses}</td>
                        <td className="w-[56px] text-center pr-0">{row.points}</td>
                      </tr>
                      {idx < paginatedStandings.length - 1 && (
                        <tr>
                          <td colSpan={6} style={{ padding: 0, border: 0 }}>
                            <div style={{ height: '4px', background: '#e2e2e2', width: '100%' }} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex justify-between w-[350px] mt-4 mx-auto">
          <button
            className={`border-4 w-[80px] h-[56px] flex items-center justify-center text-[15px] bg-transparent transition ${
              page === 0
                ? 'border-[#b0b0b0] text-[#b0b0b0] cursor-not-allowed'
                : 'border-white text-white hover:bg-white hover:text-[#397a33] cursor-pointer'
            }`}
            onClick={handlePrevPage}
            disabled={page === 0}
            aria-label="Previous"
          >
            {'<'}
          </button>
          <button
            className="border-4 border-white w-[180px] h-[56px] flex items-center justify-center text-[15px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition mx-2 cursor-pointer"
            onClick={handleContinue}
          >
            {isSeasonComplete ? 'END SEASON' : 'CONTINUE'}
          </button>
          <button
            className={`border-4 w-[80px] h-[56px] flex items-center justify-center text-[15px] bg-transparent transition ${
              page >= totalPages - 1 || totalPages <= 1
                ? 'border-[#b0b0b0] text-[#b0b0b0] cursor-not-allowed'
                : 'border-white text-white hover:bg-white hover:text-[#397a33] cursor-pointer'
            }`}
            onClick={handleNextPage}
            disabled={page >= totalPages - 1 || totalPages <= 1}
            aria-label="Next"
          >
            {'>'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default TeamStandings;
