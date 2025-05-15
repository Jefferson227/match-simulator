import { FC } from 'react';

interface ScoreProps {
  homeScore: number;
  guestScore: number;
}

const Score: FC<ScoreProps> = ({ homeScore, guestScore }) => {
  return (
    <div className="flex justify-between items-center font-press-start text-[22px] text-[#e2e2e2] mx-2 w-[70px]">
      <div>{homeScore}</div>
      <div>x</div>
      <div>{guestScore}</div>
    </div>
  );
};

export default Score;
