import React from 'react';

interface TeamAdditionalInfoProps {
  teamName?: string;
  morale?: number;
  championshipName?: string;
  roundInfo?: string;
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
  roundInfo = 'ROUND 13 OF 38 - 2025',
  position = '12TH PLACE',
  nextOpponent = 'CRUZEIRO',
  nextOpponentPosition = '3RD PLACE',
  onBack = () => {},
  onPrevious = () => {},
  onNext = () => {},
}) => {
  return (
    <div className="w-[350px] mt-[26px] bg-[#3c7a33] text-white font-press-start p-5 border-4 border-white mx-auto">
      <div className="bg-black text-white p-2 text-center mb-5 border-2 border-white">
        <h2 className="m-0 text-[17px] uppercase tracking-wider">{teamName}</h2>
      </div>

      <div className="mb-5 p-3 bg-black/20 border-2 border-white">
        <div className="mb-2 text-[17px]">MORALE</div>
        <div className="w-full h-5 bg-[#316229] border-2 border-white my-2 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${morale}%` }}
          />
        </div>
      </div>

      <div className="mb-5 p-3 bg-black/20 border-2 border-white">
        <div className="font-bold mb-2 underline">CHAMPIONSHIP</div>
        <div className="flex flex-col gap-2 text-sm">
          <div>{championshipName}</div>
          <div>{roundInfo}</div>
          <div>{position}</div>
        </div>
      </div>

      <div className="mb-5 p-3 bg-black/20 border-2 border-white">
        <div className="font-bold mb-2 underline">NEXT MATCH</div>
        <div className="flex flex-col items-center p-2">
          <div className="text-lg font-bold mb-1">{nextOpponent}</div>
          <div className="text-xs opacity-80">{nextOpponentPosition}</div>
        </div>
      </div>

      <div className="flex justify-between mt-5">
        <button
          className="bg-transparent border-2 border-white text-white px-4 py-2 font-press-start text-sm transition-all hover:bg-white/20 active:translate-y-px"
          onClick={onPrevious}
        >
          &lt;
        </button>
        <button
          className="bg-transparent border-2 border-white text-white px-4 py-2 font-press-start text-sm transition-all hover:bg-white/20 active:translate-y-px"
          onClick={onBack}
        >
          BACK
        </button>
        <button
          className="bg-transparent border-2 border-white text-white px-4 py-2 font-press-start text-sm transition-all hover:bg-white/20 active:translate-y-px"
          onClick={onNext}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default TeamAdditionalInfo;
