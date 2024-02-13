import Team from '../interfaces/Team';

const TeamComponent: React.FC<Team> = ({ name, score }) => (
  <div className="team">
    <h2>{name}</h2>
    <p>{score}</p>
  </div>
);

export default TeamComponent;
