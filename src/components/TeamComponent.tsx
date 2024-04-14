interface TeamComponentProps {
  name: string;
  outlineColor: string;
  backgroundColor: string;
  teamNameColor: string;
}

const TeamComponent: React.FC<TeamComponentProps> = ({
  name,
  outlineColor,
  backgroundColor,
  teamNameColor,
}) => (
  <div className="team-padding" style={{ backgroundColor: outlineColor }}>
    <div className="team" style={{ backgroundColor: backgroundColor }}>
      <h2 className="team-name" style={{ color: teamNameColor }}>
        {name}
      </h2>
    </div>
  </div>
);

export default TeamComponent;
