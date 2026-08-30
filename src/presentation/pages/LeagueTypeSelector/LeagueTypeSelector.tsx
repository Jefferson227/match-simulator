import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import MainLayout from '../../components/MainLayout/MainLayout';
import LeagueType from '../../../domain/enums/LeagueType';

const LeagueTypeSelector: React.FC = () => {
  const { t } = useTranslation();

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  useEffect(() => {
    if (state.hasError)
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: state.errorMessage });
  }, [state]);

  const selectLeagueType = (leagueType: LeagueType) => {
    engine.dispatch({
      type: 'SET_LEAGUE_TYPE',
      leagueType,
    });
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
          {t('leagueTypeSelector.selectLeagueType')}
        </h1>

        <div className="flex flex-col items-center gap-4 w-[342px] max-w-full">
          <button
            onClick={() => selectLeagueType('womens')}
            className="w-[342px] h-[80px] px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] [text-shadow:-3px_3px_0_#2a5624] hover:[text-shadow:none] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '-6px 6px 0 #2a5624' }}
          >
            {t('leagueTypeSelector.womensLeague')}
          </button>
          <button
            onClick={() => selectLeagueType('mens')}
            className="w-[342px] h-[80px] px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] [text-shadow:-3px_3px_0_#2a5624] hover:[text-shadow:none] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '-6px 6px 0 #2a5624' }}
          >
            {t('leagueTypeSelector.mensLeague')}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default LeagueTypeSelector;
