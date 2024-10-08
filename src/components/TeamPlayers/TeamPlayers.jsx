import { useContext, useState } from 'react';
import { MatchContext } from '../../contexts/MatchContext';
import './TeamPlayers.css';

const TeamPlayers = ({ team }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  const { setTeamSquadView } = useContext(MatchContext);

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
        <div
          className="players"
          style={{ display: showSubstitutes ? 'none' : 'block' }}
        >
          {team.players.map((player) => (
            <div
              className="player"
              key={player.id}
              style={{
                color:
                  player.id === selectedPlayer
                    ? team.colors.background
                    : team.colors.name,
                backgroundColor:
                  player.id === selectedPlayer
                    ? team.colors.name
                    : team.colors.background,
              }}
              onClick={() => setSelectedPlayer(player.id)}
            >
              <div className="position">{player.position}</div>
              <div className="name">{player.name}</div>
              <div className="strength">{player.strength}</div>
            </div>
          ))}
        </div>
        <div
          className="players"
          style={{
            display: showSubstitutes && team.substitutes ? 'block' : 'none',
          }}
        >
          {team.substitutes.map((substitute) => (
            <div
              className="player"
              key={substitute.id}
              style={{
                color:
                  substitute.id === selectedPlayer
                    ? team.colors.background
                    : team.colors.name,
                backgroundColor:
                  substitute.id === selectedPlayer
                    ? team.colors.name
                    : team.colors.background,
              }}
              onClick={() => setSelectedPlayer(substitute.id)}
            >
              <div className="position">{substitute.position}</div>
              <div className="name">{substitute.name}</div>
              <div className="strength">{substitute.strength}</div>
            </div>
          ))}
        </div>
        <div
          className="substitute-button-container"
          style={{ display: showSubstitutes ? 'none' : 'block' }}
        >
          <button
            className="substitute-button"
            style={{
              backgroundColor: team.colors.background,
              outlineColor: team.colors.outline,
              color: team.colors.name,
            }}
            onClick={() => setShowSubstitutes(true)}
          >
            SEE SUBSTITUTES
          </button>
        </div>
      </div>

      <div className="footer-buttons-container">
        <div
          className="back-to-main-team"
          style={{ display: showSubstitutes ? 'block' : 'none' }}
        >
          <button
            className="back-to-match"
            onClick={() => setShowSubstitutes(false)}
          >
            BACK TO MAIN TEAM
          </button>
        </div>
        <button
          className="back-to-match"
          onClick={() => setTeamSquadView(null)}
        >
          BACK TO MATCH
        </button>
      </div>
    </div>
  );
};

export default TeamPlayers;
