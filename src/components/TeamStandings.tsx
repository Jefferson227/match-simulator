import React from 'react';

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
  return (
    <div
      className="font-press-start min-h-screen"
      style={{ backgroundColor: '#3d7a33' }}
    >
      <div
        className="w-[350px] h-[610px] mx-auto mt-[26px] mb-0 flex flex-col items-center"
        style={{ backgroundColor: '#397a33', border: '4px solid #e2e2e2' }}
      >
        <div className="text-center text-[18px] text-white font-bold mt-6 mb-2 tracking-wider">
          TABLE STANDINGS
        </div>
        <div className="w-full" style={{ maxHeight: 536, overflowY: 'auto' }}>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-[18px] text-white">
                <th className="font-normal"></th>
                <th className="font-normal"></th>
                <th className="font-normal">W</th>
                <th className="font-normal">D</th>
                <th className="font-normal">L</th>
                <th className="font-normal">GD</th>
                <th className="font-normal pr-4">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, idx) => (
                <React.Fragment key={idx}>
                  <tr className="text-[18px] text-white" style={{}}>
                    <td className="pl-4 py-2 text-center">{idx + 1}</td>
                    <td className="text-center">{row.team}</td>
                    <td className="text-center">{row.w}</td>
                    <td className="text-center">{row.d}</td>
                    <td className="text-center">{row.l}</td>
                    <td className="text-center">{row.gd}</td>
                    <td className="pr-4 text-center">{row.pts}</td>
                  </tr>
                  {idx < standings.length - 1 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0, border: 0 }}>
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
          className="border-4 border-white w-[80px] h-[56px] flex items-center justify-center text-[18px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition"
          onClick={onPrev}
          aria-label="Previous"
        >
          {'<'}
        </button>
        <button
          className="border-4 border-white w-[180px] h-[56px] flex items-center justify-center text-[18px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition mx-2"
          onClick={onContinue}
        >
          CONTINUE
        </button>
        <button
          className="border-4 border-white w-[80px] h-[56px] flex items-center justify-center text-[18px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition"
          onClick={onNext}
          aria-label="Next"
        >
          {'>'}
        </button>
      </div>
    </div>
  );
};

export default TeamStandings;
