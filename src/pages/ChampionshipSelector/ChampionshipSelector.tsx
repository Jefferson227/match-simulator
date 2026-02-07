import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';
import { getChampionships } from '../../../use-cases/ChampionshipUseCases';
import MainLayout from '../../components/MainLayout/MainLayout';

const CHAMPIONSHIPS_PER_PAGE = 6;

const ChampionshipSelector: React.FC = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  const result = getChampionships();
  if (!result.succeeded)
    engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: result.error.message });

  const championships = result.getResult();
  const totalPages = Math.ceil(championships.length / CHAMPIONSHIPS_PER_PAGE);

  useEffect(() => {
    if (state.hasError)
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: state.errorMessage });
  }, [state]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const startIndex = currentPage * CHAMPIONSHIPS_PER_PAGE;
  const selectedChampionships = championships.slice(
    startIndex,
    startIndex + CHAMPIONSHIPS_PER_PAGE
  );

  const selectChampionship = (championshipInternalName: string) => {
    engine.dispatch({
      type: 'INIT_CHAMPIONSHIPS',
      championshipInternalName,
    });
    engine.dispatch({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamSelector',
    });
  };

  return (
    <MainLayout>
      <div
        className="font-press-start flex flex-col items-center justify-center py-8"
        style={{ backgroundColor: '#3d7a33', color: 'white' }}
      >
        <h1 className="text-lg mb-8 text-center">{t('championshipSelector.selectChampionship')}</h1>

        <div className="flex flex-col gap-4 w-full h-[560px] max-w-md px-6">
          {selectedChampionships.map((championship, index) => (
            <button
              key={index}
              onClick={() => selectChampionship(championship.internalName)}
              className="w-[342px] h-[80px] px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              {championship.name}
            </button>
          ))}
        </div>

        <div className="flex justify-between w-[390px] px-6 max-w-md mt-8">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="border-4 border-white w-20 h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt;
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className="border-4 border-white w-20 h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &gt;
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChampionshipSelector;
