import Team from '../interfaces/Team';

const TeamComponent: React.FC<Team> = ({
  name,
  outlineColor,
  backgroundColor,
  nameColor,
}) => (
  <div className="team-padding" style={{ backgroundColor: outlineColor }}>
    <div className="team" style={{ backgroundColor: backgroundColor }}>
      <h2 className="team-name" style={{ color: nameColor }}>
        {name}
      </h2>
    </div>
  </div>
);

export default TeamComponent;
