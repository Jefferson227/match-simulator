import React from 'react';

interface ClockProps {
  time: number;
  clockSpeed: number;
  handleClockClick: () => void;
}

const Clock: React.FC<ClockProps> = ({ time, clockSpeed, handleClockClick }) => {
  return (
    <div
      className="h-[33px] bg-[#fbff21] mb-[18px] font-press-start cursor-pointer transition-all duration-200 hover:bg-[#e6e600]"
      style={{ width: `${(time * 100) / 90}%` }}
      onClick={handleClockClick}
      title={`Clock Speed: ${clockSpeed === 1000 ? '1x' : clockSpeed === 500 ? '2x' : '4x'}`}
    >
      <p className="m-0 pt-1 text-right pr-2 text-[20px] text-[#1e1e1e]">{`${time}'`}</p>
    </div>
  );
};

export default Clock;
