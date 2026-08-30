import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import MainLayout from '../../components/MainLayout/MainLayout';

const TOTAL_DOTS = 3;
const DOT_INTERVAL_IN_MS = 500;

// TODO: replace with the team actually drawn for the player once the draw is implemented
const DRAWN_TEAM = {
  name: 'Amazonas Futebol Clube',
  colors: {
    outline: '#fbab2c',
    background: '#05030e',
    text: '#fbab2c',
  },
};

const TeamAssigner: React.FC = () => {
  const { t } = useTranslation();
  const [visibleDots, setVisibleDots] = useState(0);

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  useEffect(() => {
    if (state.hasError)
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: state.errorMessage });
  }, [state]);

  useEffect(() => {
    if (visibleDots >= TOTAL_DOTS) return;

    const timeoutId = setTimeout(() => setVisibleDots((dots) => dots + 1), DOT_INTERVAL_IN_MS);
    return () => clearTimeout(timeoutId);
  }, [visibleDots]);

  const isDrawFinished = visibleDots >= TOTAL_DOTS;

  const startGame = () => {
    engine.dispatch({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'ChampionshipSelector',
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

          {isDrawFinished ? (
            <div
              data-testid="drawn-team"
              className="w-[342px] min-h-[80px] px-4 py-4 flex items-center justify-center border-4 text-lg uppercase text-center"
              style={{
                borderColor: DRAWN_TEAM.colors.outline,
                backgroundColor: DRAWN_TEAM.colors.background,
                color: DRAWN_TEAM.colors.text,
                boxShadow: '-6px 6px 0 #2a5624',
              }}
            >
              {DRAWN_TEAM.name}
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
            disabled={!isDrawFinished}
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
