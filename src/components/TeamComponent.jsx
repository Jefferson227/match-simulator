const TeamComponent = ({
  name,
  outlineColor,
  backgroundColor,
  teamNameColor,
  setTeamPlayersView,
}) => (
  <div
    className="team-padding"
    style={{ backgroundColor: outlineColor }}
    onClick={setTeamPlayersView}
  >
    <div
      className="team"
      style={{ backgroundColor: backgroundColor }}
    >
      <h2 className="team-name" style={{ color: teamNameColor }}>
        {name}
      </h2>
    </div>
  </div>
);

export default TeamComponent;
