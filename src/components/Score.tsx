import ScoreProps from '../props/ScoreProps';

const Score: React.FC<ScoreProps> = ({ homeScore, guestScore }) => {
  return (
    <div className="score">
      <div className="home-score">{homeScore}</div>
      <div className="divisor">x</div>
      <div className="guest-score">{guestScore}</div>
    </div>
  );
};

export default Score;
