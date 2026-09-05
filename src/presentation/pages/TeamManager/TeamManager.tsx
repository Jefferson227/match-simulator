import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../components/MainLayout/MainLayout';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import ChampionshipUseCases from '../../../use-cases/ChampionshipUseCases';
import Player from '../../../domain/models/Player';
import { Team } from '../../../domain/models/Team';
import Formations, { FORMATIONS } from '../../../domain/enums/Formations';

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

const MAX_SUBS_PER_POSITION = 2;

// TODO: replace with the real team budget once it exists in the domain model
const PLACEHOLDER_BUDGET = 'R$ 12.6M';

function getOrdinal(position: number): string {
  const lastTwoDigits = position % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${position}th`;

  switch (position % 10) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
}

const TeamManager: React.FC = () => {
  const { t } = useTranslation();

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  const [team, setTeam] = useState<Team>(EMPTY_TEAM);

  const championship = state.championshipContainer.playableChampionship;
  const championshipUseCases = new ChampionshipUseCases(state);

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
  }, []);

  useEffect(() => {
    if (state.hasError)
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: state.errorMessage });
  }, [state.hasError]);

  const getStandingPosition = (teamId: string): number | null =>
    championship?.standings?.find((standing) => standing.team.id === teamId)?.position ?? null;

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

  // Best available lineup, used until a squad selection screen exists again
  const buildBestLineup = (): { starters: Player[]; subs: Player[] } => {
    const players = team.players ?? [];
    if (!players.length) return { starters: [], subs: [] };

    const isFormationAvailable = (formation: Formations) => {
      const [df, mf, fw] = formation.split('-').map(Number);
      return (
        players.filter((p) => p.position === 'GK').length >= 1 &&
        players.filter((p) => p.position === 'DF').length >= df &&
        players.filter((p) => p.position === 'MF').length >= mf &&
        players.filter((p) => p.position === 'FW').length >= fw
      );
    };

    const formation = FORMATIONS.find(isFormationAvailable);
    const strongestFirst = (a: Player, b: Player) => b.strength - a.strength;
    const byPosition = (position: Player['position'], count: number, pool: Player[]) =>
      pool
        .filter((p) => p.position === position)
        .sort(strongestFirst)
        .slice(0, count);

    let starters: Player[] = [];
    if (formation) {
      const [df, mf, fw] = formation.split('-').map(Number);
      starters = [
        ...byPosition('GK', 1, players),
        ...byPosition('DF', df, players),
        ...byPosition('MF', mf, players),
        ...byPosition('FW', fw, players),
      ];
    } else {
      starters = [...players].sort(strongestFirst).slice(0, 11);
    }

    const starterIds = new Set(starters.map((player) => player.id));
    const availablePlayers = players.filter((player) => !starterIds.has(player.id));
    const subs = [
      ...byPosition('GK', 1, availablePlayers),
      ...byPosition('DF', MAX_SUBS_PER_POSITION, availablePlayers),
      ...byPosition('MF', MAX_SUBS_PER_POSITION, availablePlayers),
      ...byPosition('FW', MAX_SUBS_PER_POSITION, availablePlayers),
    ];

    return { starters, subs };
  };

  const handleStartMatch = () => {
    const { starters, subs } = buildBestLineup();
    engine.dispatch({ type: 'SET_STARTERS_AND_SUBS', team, starters, subs });
    engine.dispatch({ type: 'PREPARE_TEAMS_BEFORE_MATCH' });
    engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'MatchSimulator' });
  };

  const backgroundColor = team.colors.background;
  const outlineColor = team.colors.outline;
  const nameColor = team.colors.text;

  const teamPosition = getStandingPosition(team.id);
  const opponentPosition = nextOpponent ? getStandingPosition(nextOpponent.id) : null;
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

  // TODO: wire these up once the corresponding screens exist
  const secondaryButtons: string[][] = [
    ['teamManager.stadium', 'teamManager.market'],
    ['teamManager.stats', 'teamManager.contracts'],
    ['teamManager.calendar', 'teamManager.campaigns'],
  ];

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
          </div>
          {totalRounds > 0 && (
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
            style={shortButtonStyle}
            onClick={handleStartMatch}
          >
            {t('teamManager.startMatch')}
          </button>

          {secondaryButtons.map((row) => (
            <div key={row.join('-')} className="w-[90%] flex justify-between gap-2">
              {row.map((labelKey) => (
                <button
                  key={labelKey}
                  className="w-1/2 border-[4px] py-[17px] text-[10px]"
                  style={shortButtonStyle}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default TeamManager;
