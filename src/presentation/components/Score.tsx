import { FC } from 'react';

interface ScoreProps {
  homeScore: number;
  guestScore: number;
  onClick?: () => void;
}

const Score: FC<ScoreProps> = ({ homeScore, guestScore, onClick }) => {
  return (
    <div
      className={
        'flex justify-between items-center font-press-start text-[15px] text-[#e2e2e2] mx-2 w-[70px]' +
        (onClick ? ' cursor-pointer' : '')
      }
      onClick={onClick}
    >
      <div>{homeScore}</div>
      <div>x</div>
      <div>{guestScore}</div>
    </div>
  );
};

export default Score;
