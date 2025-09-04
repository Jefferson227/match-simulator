import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import generalService from '../../services/generalService';
import { ChampionshipConfig } from '../../types';

const CHAMPIONSHIPS_PER_PAGE = 6;

const ChampionshipSelector: React.FC = () => {
  const { t } = useTranslation();
  const { setScreenDisplayed } = useContext(GeneralContext);
  const { setChampionship, setYear, setOtherChampionships } = useChampionshipContext();
  const [currentPage, setCurrentPage] = useState(0);

  const championships = generalService.getAllChampionships();
  const totalPages = Math.ceil(championships.length / CHAMPIONSHIPS_PER_PAGE);

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

  const handleChampionshipClick = (championship: ChampionshipConfig) => {
    setChampionship(championship);
    setYear(new Date().getFullYear()); // Set initial year to current year

    const otherChamps = championships.filter((c) => c.internalName !== championship.internalName);
    setOtherChampionships(otherChamps);
    setScreenDisplayed('TeamSelector');
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
        {selectedChampionships.map((champ) => (
          <button
            key={champ.id}
            onClick={() => handleChampionshipClick(champ)}
            className="w-[342px] h-[80px] px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
          >
            {champ.name}
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
