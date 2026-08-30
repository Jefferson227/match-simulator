import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import ChampionshipUseCases from '../../../use-cases/ChampionshipUseCases';
import MainLayout from '../../components/MainLayout/MainLayout';
import { Championship } from '../../../domain/models/Championship';

const CHAMPIONSHIPS_PER_PAGE = 6;

const ChampionshipSelector: React.FC = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [championships, setChampionships] = useState<Championship[]>([]);

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  const championshipUseCases = new ChampionshipUseCases(state);

  const totalPages = Math.ceil(championships.length / CHAMPIONSHIPS_PER_PAGE);

  // Load championships
  useEffect(() => {
    let championshipsToBeSet = [] as Championship[];
    try {
      championshipsToBeSet = championshipUseCases.getChampionships(state.leagueType);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage });
    }

    setChampionships(championshipsToBeSet);
    setCurrentPage(0);
  }, [state.leagueType]);

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
        className="font-press-start flex h-[calc(100dvh-40px)] w-[calc(100dvw-40px)] max-w-[342px] flex-col items-center justify-center gap-4 overflow-hidden"
        style={{ backgroundColor: '#3d7a33', color: 'white' }}
      >
        <h1 className="text-lg text-center shrink-0">
          {t('championshipSelector.selectChampionship')}
        </h1>

        <div className="flex flex-1 min-h-0 w-full flex-col justify-center gap-2 md:gap-4">
          {championships.length === 0 && (
            <p className="text-lg text-center">
              {t('championshipSelector.noChampionshipsAvailable')}
            </p>
          )}
          {selectedChampionships.map((championship, index) => (
            <button
              key={index}
              onClick={() => selectChampionship(championship.internalName)}
              className="w-full flex-1 min-h-[48px] max-h-[80px] px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {championship.name}
            </button>
          ))}
        </div>

        <div className="flex w-full shrink-0 justify-between">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="border-4 border-white w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt;
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className="border-4 border-white w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &gt;
          </button>
        </div>

        <button
          onClick={() =>
            engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'LeagueTypeSelector' })
          }
          className="w-full h-16 md:h-20 shrink-0 px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33]"
        >
          {t('championshipSelector.goBack')}
        </button>
      </div>
    </MainLayout>
  );
};

export default ChampionshipSelector;
