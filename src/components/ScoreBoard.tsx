import ScoreBoardProps from '../props/ScoreBoardProps';

const ScoreBoard: React.FC<ScoreBoardProps> = ({ goalScorer }) => {
  if (goalScorer === null) {
    return null;
  }

  return (
    <div className="scoreboard">
      <p>
        {goalScorer.firstName} {goalScorer.lastName} {goalScorer.time}
        '
      </p>
    </div>
  );
};

export default ScoreBoard;
