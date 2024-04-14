import Team from '../../interfaces/Team';
import './TeamPlayers.css';

interface TeamPlayersProps {
  team: Team;
  resetTeamPlayersState: React.MouseEventHandler<HTMLButtonElement>;
}

const TeamPlayers: React.FC<TeamPlayersProps> = ({
  team,
  resetTeamPlayersState,
}) => {
  return (
    <div className="team-players">
      <div
        className="team-container"
        style={{
          backgroundColor: team.colors.background,
          outlineColor: team.colors.outline,
        }}
      >
        <div
          className="team-name"
          style={{
            color: team.colors.name,
            borderColor: team.colors.outline,
          }}
        >
          {team.name}
        </div>
        <div className="formation" style={{ borderColor: team.colors.outline }}>
          4-3-3
        </div>
        <div className="players">
          {team.players.map((player) => (
            <div className="player" style={{ color: team.colors.name }}>
              <div className="position">{player.position}</div>
              <div className="name">{player.name}</div>
              <div className="strength">{player.strength}</div>
            </div>
          ))}
        </div>
        <div
          className="substitute-button-container"
          style={{ display: 'none' }}
        >
          <button
            className="substitute-button"
            style={{
              backgroundColor: team.colors.background,
              outlineColor: team.colors.outline,
              color: team.colors.name,
            }}
          >
            SEE SUBSTITUTES
          </button>
        </div>
      </div>

      <div className="footer-buttons-container">
        <div className="back-to-main-team" style={{ display: 'none' }}>
          <button>BACK TO MAIN TEAM</button>
        </div>
        <button className="back-to-match" onClick={resetTeamPlayersState}>
          BACK TO MATCH
        </button>
      </div>
    </div>
  );
};

export default TeamPlayers;
