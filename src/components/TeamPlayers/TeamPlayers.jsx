import { useContext, useState } from 'react';
import { MatchContext } from '../../contexts/MatchContext';
import './TeamPlayers.css';
import { useTranslation } from 'react-i18next';

const TeamPlayers = ({ teamSquadView }) => {
  const { t } = useTranslation();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedSubstitute, setSelectedSubstitute] = useState(null);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  const { setTeamSquadView, confirmSubstitution } = useContext(MatchContext);

  return (
    <div className="team-players">
      <div
        className="team-container"
        style={{
          backgroundColor: teamSquadView.team.colors.background,
          outlineColor: teamSquadView.team.colors.outline,
        }}
      >
        <div
          className="team-name"
          style={{
            color: teamSquadView.team.colors.name,
            borderColor: teamSquadView.team.colors.outline,
          }}
        >
          {teamSquadView.team.name}
        </div>
        <div
          className="formation"
          style={{ borderColor: teamSquadView.team.colors.outline }}
        >
          4-3-3
        </div>
        <div
          className="players"
          style={{ display: showSubstitutes ? 'none' : 'block' }}
        >
          {teamSquadView.team.players.map((player) => (
            <div
              className="player"
              key={player.id}
              style={{
                color:
                  player.id === selectedPlayer?.id
                    ? teamSquadView.team.colors.background
                    : teamSquadView.team.colors.name,
                backgroundColor:
                  player.id === selectedPlayer?.id
                    ? teamSquadView.team.colors.name
                    : teamSquadView.team.colors.background,
              }}
              onClick={() =>
                player.id !== selectedPlayer?.id
                  ? setSelectedPlayer(player)
                  : setSelectedPlayer(null)
              }
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
            display:
              showSubstitutes && teamSquadView.team.substitutes
                ? 'block'
                : 'none',
          }}
        >
          {teamSquadView.team.substitutes.map((substitute) => (
            <div
              className="player"
              key={substitute.id}
              style={{
                color:
                  substitute.id === selectedSubstitute?.id
                    ? teamSquadView.team.colors.background
                    : teamSquadView.team.colors.name,
                backgroundColor:
                  substitute.id === selectedSubstitute?.id
                    ? teamSquadView.team.colors.name
                    : teamSquadView.team.colors.background,
              }}
              onClick={() =>
                substitute.id !== selectedSubstitute?.id
                  ? setSelectedSubstitute(substitute)
                  : setSelectedSubstitute(null)
              }
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
              backgroundColor: teamSquadView.team.colors.background,
              outlineColor: teamSquadView.team.colors.outline,
              color: teamSquadView.team.colors.name,
            }}
            onClick={() => setShowSubstitutes(true)}
          >
            {t('teamPlayers.seeSubstitutes')}
          </button>
        </div>

        <div
          className="substitute-button-container"
          style={{
            display:
              showSubstitutes && selectedPlayer && selectedSubstitute
                ? 'block'
                : 'none',
          }}
        >
          <button
            className="substitute-button"
            style={{
              backgroundColor: teamSquadView.team.colors.background,
              outlineColor: teamSquadView.team.colors.outline,
              color: teamSquadView.team.colors.name,
            }}
            onClick={() => {
              confirmSubstitution({
                matchId: teamSquadView.matchId,
                team: teamSquadView.team,
                selectedPlayer,
                selectedSubstitute,
              });
              setSelectedPlayer(null);
              setSelectedSubstitute(null);
            }}
          >
            CONFIRF SUBST.
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
