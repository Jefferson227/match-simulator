import ScoreBoardProps from '../props/ScoreBoardProps';

const ScoreBoard: React.FC<ScoreBoardProps> = ({ homeScore, guestScore }) => {
  return (
    <div className="scoreboard">
      <div className="home-score">{homeScore}</div>
      <div className="divisor">x</div>
      <div className="guest-score">{guestScore}</div>
    </div>
  );
};

export default ScoreBoard;
