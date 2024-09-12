const TeamComponent = ({
  name,
  outlineColor,
  backgroundColor,
  teamNameColor,
  setTeamPlayersState,
}) => (
  <div
    className="team-padding"
    style={{ backgroundColor: outlineColor }}
    onClick={setTeamPlayersState}
  >
    <div className="team" style={{ backgroundColor: backgroundColor }}>
      <h2 className="team-name" style={{ color: teamNameColor }}>
        {name}
      </h2>
    </div>
  </div>
);

export default TeamComponent;
