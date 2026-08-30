import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import MainLayout from '../../components/MainLayout/MainLayout';

const CoachCreator: React.FC = () => {
  const { t } = useTranslation();
  const [coachName, setCoachName] = useState('');

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  useEffect(() => {
    if (state.hasError)
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: state.errorMessage });
  }, [state]);

  // TODO: persist the coach name in the game state once the data model is remodeled
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
        <h1
          className="text-lg mb-8 w-[342px] max-w-full text-center"
          style={{ textShadow: '-3px 3px 0 #2a5624' }}
        >
          {t('coachCreator.insertYourName')}
        </h1>

        <div className="flex flex-col items-center gap-4 w-[342px] max-w-full">
          <input
            type="text"
            value={coachName}
            onChange={(event) => setCoachName(event.target.value)}
            aria-label={t('coachCreator.insertYourName')}
            maxLength={20}
            className="w-[342px] h-[80px] px-4 border-4 border-white bg-transparent text-lg uppercase text-center outline-none focus:bg-white focus:text-[#3d7a33]"
            style={{ boxShadow: '-6px 6px 0 #2a5624' }}
          />

          <button
            onClick={startGame}
            disabled={coachName.trim().length === 0}
            className="w-[342px] h-[80px] px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] [text-shadow:-3px_3px_0_#2a5624] hover:[text-shadow:none] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '-6px 6px 0 #2a5624' }}
          >
            {t('coachCreator.startGame')}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default CoachCreator;
