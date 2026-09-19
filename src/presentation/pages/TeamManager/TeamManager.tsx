import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../components/MainLayout/MainLayout';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import ChampionshipUseCases from '../../../use-cases/ChampionshipUseCases';
import { Team } from '../../../domain/models/Team';
import SquadSelection, {
  PlayerSelectionState,
  PlayerStates,
  countStarters,
  selectBestLineup,
} from './SquadSelection';

const EMPTY_TEAM: Team = {
  id: '00000000-0000-0000-0000-000000000000',
  fullName: '',
  shortName: '',
  abbreviation: '',
  colors: {
    outline: '#e2e2e2',
    background: '#3c7a33',
    text: '#e2e2e2',
  },
  players: [],
  morale: 50,
  isControlledByHuman: false,
};

// TODO: replace with the real team budget once it exists in the domain model
const PLACEHOLDER_BUDGET = 'R$ 12.6M';

const TeamManager: React.FC = () => {
  const { t } = useTranslation();
  const getOrdinal = (position: number) =>
    t('teamManager.place', { count: position, ordinal: true });

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  const [team, setTeam] = useState<Team>(EMPTY_TEAM);
  const [showSquad, setShowSquad] = useState(false);
  // Starts as the best available lineup; Choose Strategy lets the coach change it
  const [playerStates, setPlayerStates] = useState<PlayerStates>({});

  const championshipUseCases = new ChampionshipUseCases(state);
  const championship = championshipUseCases.getPlayableChampionship();

  // Get team controlled by human
  useEffect(() => {
    let teamToBeSet = EMPTY_TEAM;
    try {
      teamToBeSet = championshipUseCases.getTeamControlledByHuman(championship);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage });
    }

    setTeam(teamToBeSet);
    setPlayerStates(selectBestLineup(teamToBeSet.players ?? []));
  }, []);

  useEffect(() => {
    if (state.hasError)
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: state.errorMessage });
  }, [state.hasError]);

  // Which phase is being played, so a knockout shows its name instead of a league position and a
  // round number, and a group stage names the group the club is in.
  const phaseView = championshipUseCases.getPhaseView(championship);
  const isKnockoutPhase = phaseView.kind === 'knockout';
  const groupOfTeam = phaseView.groups?.find((group) =>
    group.standings.some((standing) => standing.team.id === team.id)
  )?.group;

  // A group stage ranks each club within its own group, not across the whole division.
  const getStandingPosition = (teamId: string): number | null => {
    const standings = phaseView.groups?.length
      ? phaseView.groups.flatMap((group) => group.standings)
      : championship?.standings;
    return standings?.find((standing) => standing.team.id === teamId)?.position ?? null;
  };

  // Opponent for the current round, if the round is still available
  const nextOpponent = useMemo<Team | null>(() => {
    if (!team.id || team.id === EMPTY_TEAM.id) return null;

    try {
      const matches = championshipUseCases.getMatchesForCurrentRound(championship);
      const match = matches.find((m) => m.homeTeam.id === team.id || m.awayTeam.id === team.id);
      if (!match) return null;

      return match.homeTeam.id === team.id ? match.awayTeam : match.homeTeam;
    } catch {
      return null;
    }
  }, [championship, team.id]);

  const players = team.players ?? [];
  const isLineupComplete =
    players.length > 0 && countStarters(playerStates) === Math.min(11, players.length);

  const handleStartMatch = () => {
    if (!isLineupComplete) return;
    const withState = (selectionState: PlayerSelectionState) =>
      players.filter((player) => playerStates[player.id] === selectionState);
    engine.dispatch({
      type: 'SET_STARTERS_AND_SUBS',
      team,
      starters: withState(PlayerSelectionState.Selected),
      subs: withState(PlayerSelectionState.Substitute),
    });
    engine.dispatch({ type: 'PREPARE_TEAMS_BEFORE_MATCH' });
    engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'MatchSimulator' });
  };

  const backgroundColor = team.colors.background;
  const outlineColor = team.colors.outline;
  const nameColor = team.colors.text;

  const teamPosition = isKnockoutPhase ? null : getStandingPosition(team.id);
  const opponentPosition =
    nextOpponent && !isKnockoutPhase ? getStandingPosition(nextOpponent.id) : null;
  const currentRound = championship?.matchContainer?.currentRound ?? 0;
  const totalRounds = championship?.matchContainer?.totalRounds ?? 0;
  const morale = Math.max(0, Math.min(100, team.morale ?? 0));

  const rowStyle = {
    backgroundColor,
    color: nameColor,
    borderBottom: `4px solid ${outlineColor}`,
  };

  const shortButtonStyle = {
    borderColor: outlineColor,
    backgroundColor,
    color: nameColor,
  };

  if (showSquad) {
    return (
      <MainLayout>
        <SquadSelection
          team={team}
          playerStates={playerStates}
          onPlayerStatesChange={setPlayerStates}
          onGoBack={() => setShowSquad(false)}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div
        className="w-[350px] mx-auto"
        style={{ backgroundColor, border: `4px solid ${outlineColor}` }}
      >
        <div className="text-center text-[20px] py-2 uppercase" style={rowStyle}>
          {team.fullName}
        </div>

        <div className="text-left text-[10px] px-4 py-3 uppercase leading-[18px]" style={rowStyle}>
          <div>{championship?.name}</div>
          <div>
            {t('teamManager.position')}: {teamPosition ? getOrdinal(teamPosition) : '-'}
            {groupOfTeam !== undefined
              ? ` (${t('standings.group', { number: groupOfTeam + 1 })})`
              : ''}
          </div>
          {isKnockoutPhase && phaseView.phaseName && <div>{phaseView.phaseName}</div>}
          {!isKnockoutPhase && totalRounds > 0 && (
            <div>{t('teamManager.roundOf', { current: currentRound, total: totalRounds })}</div>
          )}
        </div>

        <div className="text-left text-[10px] px-4 py-3 uppercase" style={rowStyle}>
          {t('teamManager.nextMatch')}:{' '}
          {nextOpponent
            ? `${nextOpponent.shortName || nextOpponent.fullName}${
                opponentPosition ? ` - ${getOrdinal(opponentPosition)}` : ''
              }`
            : '-'}
        </div>

        <div className="px-4 py-3" style={rowStyle}>
          <div className="flex justify-between text-[12px] uppercase mb-2">
            <span>{t('teamManager.morale')}</span>
            <span>{morale}%</span>
          </div>
          <div
            className="w-full h-[16px] border-4"
            style={{ borderColor: outlineColor }}
            role="progressbar"
            aria-label={t('teamManager.morale')}
            aria-valuenow={morale}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full"
              style={{ width: `${morale}%`, backgroundColor: outlineColor }}
            />
          </div>
        </div>

        <div className="text-left text-[10px] px-4 py-3 uppercase" style={rowStyle}>
          {t('teamManager.budget')}: {PLACEHOLDER_BUDGET}
        </div>

        <div className="flex flex-col items-center gap-2 py-[17px]">
          <button
            className="w-[90%] border-[4px] py-[17px] text-[16px]"
            style={{
              ...shortButtonStyle,
              opacity: isLineupComplete ? 1 : 0.5,
              cursor: isLineupComplete ? 'pointer' : 'not-allowed',
            }}
            onClick={handleStartMatch}
            disabled={!isLineupComplete}
          >
            {t('teamManager.startMatch')}
          </button>

          <button
            className="w-[90%] border-[4px] py-[17px] text-[16px]"
            style={shortButtonStyle}
            onClick={() => setShowSquad(true)}
          >
            {t('teamManager.chooseStrategy')}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default TeamManager;
