import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import MainLayout from '../../components/MainLayout/MainLayout';
import ChampionshipUseCases from '../../../use-cases/ChampionshipUseCases';
import { GameState } from '../../../game-engine/GameState';
import { Team } from '../../../domain/models/Team';

const TOTAL_DOTS = 3;
const DOT_INTERVAL_IN_MS = 500;

const TeamAssigner: React.FC = () => {
  const { t } = useTranslation();
  const [visibleDots, setVisibleDots] = useState(0);
  const [hasDispatchedDraw, setHasDispatchedDraw] = useState(false);
  const [drawnTeam, setDrawnTeam] = useState<Team | null>(null);
  const drawGuard = useRef(false);

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  useEffect(() => {
    if (state.hasError)
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: state.errorMessage });
  }, [state.hasError]);

  // Every dispatch re-renders every subscriber, so the ref keeps the draw to exactly one.
  useEffect(() => {
    if (drawGuard.current) return;
    drawGuard.current = true;

    engine.dispatch({ type: 'DRAW_TEAM_FOR_HUMAN_PLAYER' });
    setHasDispatchedDraw(true);
  }, []);

  useEffect(() => {
    if (!hasDispatchedDraw || state.hasError) return;

    try {
      const championshipUseCases = new ChampionshipUseCases({} as GameState);
      setDrawnTeam(
        championshipUseCases.getTeamControlledByHuman(
          state.championshipContainer.playableChampionship
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage });
    }
  }, [hasDispatchedDraw, state.championshipContainer]);

  useEffect(() => {
    if (visibleDots >= TOTAL_DOTS) return;

    const timeoutId = setTimeout(() => setVisibleDots((dots) => dots + 1), DOT_INTERVAL_IN_MS);
    return () => clearTimeout(timeoutId);
  }, [visibleDots]);

  const isDrawRevealed = visibleDots >= TOTAL_DOTS && drawnTeam !== null;

  const startGame = () => {
    engine.dispatch({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
  };

  return (
    <MainLayout>
      <div
        className="font-press-start w-full flex flex-col items-center justify-center py-8"
        style={{ backgroundColor: '#3d7a33', color: 'white' }}
      >
        <div className="flex flex-col items-center gap-4 w-[342px] max-w-full">
          <p
            className="text-sm text-center uppercase w-[342px] max-w-full"
            style={{ textShadow: '-3px 3px 0 #2a5624' }}
          >
            {t('teamAssigner.yourTeamIs', { coachName: state.coachName })}
          </p>

          {isDrawRevealed ? (
            <div
              data-testid="drawn-team"
              className="w-[342px] min-h-[80px] px-4 py-4 flex items-center justify-center border-4 text-lg uppercase text-center"
              style={{
                borderColor: drawnTeam.colors.outline,
                backgroundColor: drawnTeam.colors.background,
                color: drawnTeam.colors.text,
                boxShadow: '-6px 6px 0 #2a5624',
              }}
            >
              {drawnTeam.fullName}
            </div>
          ) : (
            <div
              role="status"
              aria-live="polite"
              aria-label={t('teamAssigner.assigningTeam')}
              className="w-[342px] min-h-[80px] flex items-center justify-center text-lg"
              style={{ textShadow: '-3px 3px 0 #2a5624' }}
            >
              {'.'.repeat(visibleDots)}
            </div>
          )}

          <button
            onClick={startGame}
            disabled={!isDrawRevealed}
            className="w-[342px] h-[80px] px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] [text-shadow:-3px_3px_0_#2a5624] hover:[text-shadow:none] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '-6px 6px 0 #2a5624' }}
          >
            {t('teamAssigner.startGame')}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default TeamAssigner;
