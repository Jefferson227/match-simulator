import React from 'react';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';
import MainLayout from '../MainLayout/MainLayout';

const ErrorScreen: React.FC = () => {
  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  return (
    <MainLayout>
      <p>Sorry, but an error has occurred and the game need to be reset.</p>

      <p className="mt-8">Error message: {state.errorMessage}</p>

      <button
        onClick={() => window.location.reload()}
        className={`w-full max-w-xs mt-8 border-4 py-4 text-lg uppercase transition border-white hover:bg-white hover:text-[#3d7a33]`}
      >
        Reset Game
      </button>
    </MainLayout>
  );
};

export default ErrorScreen;
