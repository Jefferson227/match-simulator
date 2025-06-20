import React, { useState, useContext } from 'react';
import { GeneralContext } from '../../contexts/GeneralContext';

interface TeamStanding {
  team: string;
  w: number;
  d: number;
  l: number;
  gd: number;
  pts: number;
}

interface TeamStandingsProps {
  standings?: TeamStanding[];
  onPrev?: () => void;
  onNext?: () => void;
  onContinue?: () => void;
}

const placeholderStandings: TeamStanding[] = Array.from(
  { length: 16 },
  (_, i) => ({
    team: 'CEA',
    w: 4,
    d: 3,
    l: 1,
    gd: 10,
    pts: 10,
  })
);

const TeamStandings: React.FC<TeamStandingsProps> = ({
  standings = placeholderStandings,
  onPrev,
  onNext,
  onContinue,
}) => {
  const { setScreenDisplayed } = useContext(GeneralContext);
  const RESULTS_PER_PAGE = 12;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(standings.length / RESULTS_PER_PAGE);
  const paginatedStandings = standings.slice(
    page * RESULTS_PER_PAGE,
    (page + 1) * RESULTS_PER_PAGE
  );

  const handlePrevPage = () => {
    if (page > 0) setPage(page - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  return (
    <div
      className="font-press-start min-h-screen"
      style={{ backgroundColor: '#3d7a33' }}
    >
      <div className="text-center text-[18px] text-white font-bold mt-6 mb-2 tracking-wider">
        TABLE STANDINGS
      </div>
      <div
        className="w-[350px] h-[610px] mx-auto mt-0 mb-0 flex flex-col items-center"
        style={{ backgroundColor: '#397a33', border: '4px solid #e2e2e2' }}
      >
        <div
          className="w-full mt-[14px]"
          style={{ maxHeight: 587, overflowY: 'auto' }}
        >
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-[18px] text-white">
                <th className="font-normal w-[56px] text-center"> </th>
                <th className="font-normal w-[56px] text-center"> </th>
                <th className="font-normal w-[56px] text-center">W</th>
                <th className="font-normal w-[56px] text-center">D</th>
                <th className="font-normal w-[56px] text-center">L</th>
                <th className="font-normal w-[56px] text-center pr-3">PTS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStandings.map((row, idx) => (
                <React.Fragment key={idx}>
                  <tr className="text-[18px] text-white">
                    <td className="w-[56px] text-center py-2">
                      {page * RESULTS_PER_PAGE + idx + 1}
                    </td>
                    <td className="w-[56px] text-center">{row.team}</td>
                    <td className="w-[56px] text-center">{row.w}</td>
                    <td className="w-[56px] text-center">{row.d}</td>
                    <td className="w-[56px] text-center">{row.l}</td>
                    <td className="w-[56px] text-center pr-0">{row.pts}</td>
                  </tr>
                  {idx < paginatedStandings.length - 1 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, border: 0 }}>
                        <div
                          style={{
                            height: '4px',
                            background: '#e2e2e2',
                            width: '100%',
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between w-[350px] mt-4 mx-auto">
        <button
          className={`border-4 w-[80px] h-[56px] flex items-center justify-center text-[18px] bg-transparent transition ${
            page === 0
              ? 'border-[#b0b0b0] text-[#b0b0b0] cursor-not-allowed'
              : 'border-white text-white hover:bg-white hover:text-[#397a33] cursor-pointer'
          }`}
          onClick={handlePrevPage}
          disabled={page === 0}
          aria-label="Previous"
        >
          {'<'}
        </button>
        <button
          className="border-4 border-white w-[180px] h-[56px] flex items-center justify-center text-[18px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition mx-2 cursor-pointer"
          onClick={() => setScreenDisplayed('TeamManager')}
        >
          CONTINUE
        </button>
        <button
          className={`border-4 w-[80px] h-[56px] flex items-center justify-center text-[18px] bg-transparent transition ${
            page === totalPages - 1
              ? 'border-[#b0b0b0] text-[#b0b0b0] cursor-not-allowed'
              : 'border-white text-white hover:bg-white hover:text-[#397a33] cursor-pointer'
          }`}
          onClick={handleNextPage}
          disabled={page === totalPages - 1}
          aria-label="Next"
        >
          {'>'}
        </button>
      </div>
    </div>
  );
};

export default TeamStandings;
