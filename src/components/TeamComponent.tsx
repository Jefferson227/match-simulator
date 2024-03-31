import Team from '../interfaces/Team';

const TeamComponent: React.FC<Team> = ({ name, score }) => (
  <div className="team-padding">
    <div className="team">
      <h2 className="team-name">{name}</h2>
    </div>
  </div>
);

export default TeamComponent;
