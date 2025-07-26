import React from 'react';

interface TeamAdditionalInfoProps {
  teamName?: string;
  morale?: number;
  championshipName?: string;
  roundInfo?: string;
  season?: string;
  position?: string;
  nextOpponent?: string;
  nextOpponentPosition?: string;
  onBack?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

const TeamAdditionalInfo: React.FC<TeamAdditionalInfoProps> = ({
  teamName = 'CEARÁ SPORTING CLUB',
  morale = 75, // 0-100
  championshipName = 'BRASILEIRÃO SÉRIE A',
  roundInfo = 'ROUND 13 OF 38',
  season = '2025',
  position = '12TH PLACE',
  nextOpponent = 'CRUZEIRO',
  nextOpponentPosition = '3RD PLACE',
  onBack = () => {},
  onPrevious = () => {},
  onNext = () => {},
}) => {
  return (
    <div className="w-[350px] mt-[26px] bg-[#3c7a33] text-white font-press-start p-5 border-4 border-white mx-auto">
      <div className="bg-black text-white p-2 text-center mb-5 border-4 border-white">
        <h2 className="m-0 text-[17px] uppercase tracking-wider">{teamName}</h2>
      </div>

      <div className="mb-5 p-3 bg-black/20 border-4 border-white">
        <div className="mb-2 text-[17px]">MORALE</div>
        <div className="w-full h-8 bg-[#316229] border-4 border-white my-2 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${morale}%` }}
          />
        </div>
      </div>

      <div className="mb-5 p-3 bg-black/20 border-4 border-white">
        <div className="flex flex-col gap-2 text-sm">
          <div>{championshipName}</div>
          <div>SEASON {season}</div>
          <div>{roundInfo}</div>
          <div>{position}</div>
        </div>
      </div>

      <div className="mb-5 p-3 bg-black/20 border-4 border-white">
        <div className="mb-2 text-[17px]">NEXT MATCH</div>
        <div className="flex flex-col items-center">
          <div className="bg-blue-600 border-4 border-white w-[100%] mx-auto text-[17px] mb-2 flex justify-center items-center h-12">
            {nextOpponent}
          </div>
          <div className="text-xs opacity-80">{nextOpponentPosition}</div>
        </div>
      </div>

      <div className="flex justify-between mt-5">
        <button
          className="h-[70px] w-1/3 bg-transparent border-4 border-white text-white px-4 py-2 me-2 font-press-start text-[16px] transition-all hover:bg-white/20 active:translate-y-px"
          onClick={onPrevious}
        >
          &lt;
        </button>
        <button
          className="h-[70px] w-1/3 bg-transparent border-4 border-white text-white px-4 py-2 mx-2 font-press-start text-[16px] transition-all hover:bg-white/20 active:translate-y-px"
          onClick={onBack}
        >
          BACK
        </button>
        <button
          className="h-[70px] w-1/3 bg-transparent border-4 border-white text-white px-4 py-2 ms-2 font-press-start text-[16px] transition-all hover:bg-white/20 active:translate-y-px"
          onClick={onNext}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default TeamAdditionalInfo;
