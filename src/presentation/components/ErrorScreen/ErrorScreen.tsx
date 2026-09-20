import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import MainLayout from '../MainLayout/MainLayout';

const ErrorScreen: React.FC = () => {
  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);
  const { t } = useTranslation();

  return (
    <MainLayout>
      <p>{t('errorScreen.message')}</p>

      <p className="mt-8">{t('errorScreen.errorMessage', { message: state.errorMessage })}</p>

      <button
        onClick={() => window.location.reload()}
        className={`w-full max-w-xs mt-8 border-4 py-4 text-base uppercase transition border-white hover:bg-white hover:text-[#3d7a33]`}
      >
        {t('errorScreen.resetGame')}
      </button>
    </MainLayout>
  );
};

export default ErrorScreen;
