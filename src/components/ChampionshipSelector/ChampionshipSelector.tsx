import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';
import { getChampionshipInternalNames } from '../../../use-cases/ChampionshipUseCases';

const CHAMPIONSHIPS_PER_PAGE = 6;

const ChampionshipSelector: React.FC = () => {
  const { t } = useTranslation();
  const { setScreenDisplayed } = useContext(GeneralContext);
  const [currentPage, setCurrentPage] = useState(0);

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  // TODO: Get the internal name and the name to be displayed
  const result = getChampionshipInternalNames();
  if (!result.succeeded)
    engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: result.error.message });

  const championships = result.getResult();
  const totalPages = Math.ceil(championships.length / CHAMPIONSHIPS_PER_PAGE);

  useEffect(() => {
    if (state.hasError) setScreenDisplayed('ErrorScreen');
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

  return (
    <div
      className="font-press-start flex flex-col items-center justify-center py-8"
      style={{ backgroundColor: '#3d7a33', color: 'white' }}
    >
      <h1 className="text-lg mb-8 text-center">{t('championshipSelector.selectChampionship')}</h1>

      <div className="flex flex-col gap-4 w-full h-[560px] max-w-md px-6">
        {selectedChampionships.map((championshipInternalName, index) => (
          <button
            key={index}
            onClick={() =>
              engine.dispatch({
                type: 'INIT_CHAMPIONSHIPS',
                championshipInternalName,
              })
            }
            className="w-[342px] h-[80px] px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
          >
            {championshipInternalName}
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
  );
};

export default ChampionshipSelector;
