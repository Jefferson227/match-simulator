import React, { useState } from 'react';

const championships = [
  'BRASILEIRÃO SÉRIE A',
  'BRASILEIRÃO SÉRIE B',
  'BRASILEIRÃO SÉRIE C',
  'BRASILEIRÃO SÉRIE D',
  'PREMIER LEAGUE',
  'BUNDESLIGA',
  'LA LIGA',
  'SERIE A',
  'LIGUE 1',
];

const CHAMPIONSHIPS_PER_PAGE = 6;

const ChampionshipSelector: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);

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
      <h1 className="text-lg mb-8">SELECT CHAMPIONSHIP</h1>

      <div className="flex flex-col gap-4 w-full h-[560px] max-w-md px-6">
        {selectedChampionships.map((champ) => (
          <button
            key={champ}
            disabled={champ !== 'BRASILEIRÃO SÉRIE A'}
            className="w-[342px] h-[80px] px-4 border-4 border-white text-lg uppercase transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {champ}
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
