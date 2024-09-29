import { useContext } from 'react';
import { MatchContext } from '../contexts/MatchContext';

const TeamComponent = ({
  name,
  outlineColor,
  backgroundColor,
  teamNameColor,
  team,
}) => {
  const { setTeamSquadView } = useContext(MatchContext);

  return (
    <div
      className="team-padding"
      style={{ backgroundColor: outlineColor }}
      onClick={() => setTeamSquadView(team)}
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
};

export default TeamComponent;
