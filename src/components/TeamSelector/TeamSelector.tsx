import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const teams = [
  {
    name: 'FLAMENGO',
    colors: { bg: '#000000', border: '#ff0000', text: '#ffffff' },
  },
  {
    name: 'CRUZEIRO',
    colors: { bg: '#00008B', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'BRAGANTINO',
    colors: { bg: '#ffffff', border: '#00008B', text: '#ff0000' },
  },
  {
    name: 'PALMEIRAS',
    colors: { bg: '#006400', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'BAHIA',
    colors: { bg: '#0000CD', border: '#ff0000', text: '#ffffff' },
  },
  {
    name: 'FLUMINENSE',
    colors: { bg: '#006400', border: '#800000', text: '#ffffff' },
  },
  {
    name: 'A. MINEIRO',
    colors: { bg: '#000000', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'BOTAFOGO',
    colors: { bg: '#000000', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'MIRASSOL',
    colors: { bg: '#ffff00', border: '#006400', text: '#006400' },
  },
  // Add more teams to test pagination
  {
    name: 'CORINTHIANS',
    colors: { bg: '#000000', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'SÃO PAULO',
    colors: { bg: '#ffffff', border: '#ff0000', text: '#000000' },
  },
];

const TEAMS_PER_PAGE = 9;

const TeamSelector: React.FC = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(teams.length / TEAMS_PER_PAGE);

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

  const startIndex = currentPage * TEAMS_PER_PAGE;
  const selectedTeams = teams.slice(startIndex, startIndex + TEAMS_PER_PAGE);

  return (
    <div
      className="font-press-start flex flex-col items-center justify-center py-8"
      style={{ backgroundColor: '#3d7a33', color: 'white' }}
    >
      <h1 className="text-lg mb-8">{t('teamSelector.selectATeam')}</h1>

      <div className="flex flex-col gap-4 w-full h-[560px] max-w-md px-6">
        {selectedTeams.map((team) => (
          <button
            key={team.name}
            style={{
              backgroundColor: team.colors.bg,
              borderColor: team.colors.border,
              color: team.colors.text,
            }}
            className="w-[342px] h-[48px] px-4 border-4 text-lg uppercase"
          >
            {team.name}
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

export default TeamSelector;
