import { useContext } from 'react';
import { MatchContext } from '../contexts/MatchContext';

const TeamComponent = ({ team, matchId }) => {
  const { setTeamSquadView } = useContext(MatchContext);

  return (
    <div
      className="team-padding"
      style={{ backgroundColor: team.colors.outline }}
      onClick={() => setTeamSquadView({ team, matchId })}
    >
      <div className="team" style={{ backgroundColor: team.colors.background }}>
        <h2 className="team-name" style={{ color: team.colors.name }}>
          {team.abbreviation}
        </h2>
      </div>
    </div>
  );
};

export default TeamComponent;
