import { useContext, useState } from 'react';
import { MatchContext } from '../../contexts/MatchContext';
import { useTranslation } from 'react-i18next';

const TeamPlayers = ({ teamSquadView }) => {
  const { t } = useTranslation();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedSubstitute, setSelectedSubstitute] = useState(null);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  const { setTeamSquadView, confirmSubstitution } = useContext(MatchContext);

  return (
    <div className="font-press-start">
      <div
        className="w-[350px] h-[596px] mx-auto relative outline outline-4"
        style={{
          backgroundColor: teamSquadView.team.colors.background,
          outlineColor: teamSquadView.team.colors.outline,
        }}
      >
        <div
          className="max-h-[80px] border-b-2 text-[20px] py-[22px] px-[22px] uppercase"
          style={{
            color: teamSquadView.team.colors.name,
            borderColor: teamSquadView.team.colors.outline,
          }}
        >
          {teamSquadView.team.name}
        </div>
        <div
          className="max-h-[60px] border-b-2 text-[16px] py-[22px] px-[22px] text-[#e2e2e2]"
          style={{ borderColor: teamSquadView.team.colors.outline }}
        >
          4-3-3
        </div>
        <div className={showSubstitutes ? 'hidden' : 'block'}>
          {teamSquadView.team.players.map((player) => (
            <div
              className="text-[14px] flex justify-between py-2 px-6 uppercase cursor-pointer"
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
              <div className="w-8">
                {t(`teamPlayers.positions.${player.position}`)}
              </div>
              <div className="w-[200px] text-left">{player.name}</div>
              <div className="w-8">{player.strength}</div>
            </div>
          ))}
        </div>
        <div
          className={
            showSubstitutes && teamSquadView.team.substitutes
              ? 'block'
              : 'hidden'
          }
        >
          {teamSquadView.team.substitutes.map((substitute) => (
            <div
              className="text-[14px] flex justify-between py-2 px-6 uppercase cursor-pointer"
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
              <div className="w-8">
                {t(`teamPlayers.positions.${substitute.position}`)}
              </div>
              <div className="w-[200px] text-left">{substitute.name}</div>
              <div className="w-8">{substitute.strength}</div>
            </div>
          ))}
        </div>
        <div
          className={`absolute bottom-0 left-0 w-full mb-[15px] ${
            showSubstitutes ? 'hidden' : 'block'
          }`}
        >
          <button
            className="w-[318px] h-[58px] text-[16px] border-0 outline outline-4"
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
          className={
            showSubstitutes && selectedPlayer && selectedSubstitute
              ? 'absolute bottom-0 left-0 w-full mb-[15px] block'
              : 'hidden'
          }
        >
          <button
            className="w-[318px] h-[58px] text-[16px] border-0 outline outline-4"
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
            {t('teamPlayers.confirmSubstitution')}
          </button>
        </div>
      </div>

      <div className="mt-[18px]">
        <div className={showSubstitutes ? 'block' : 'hidden'}>
          <button
            className="w-[318px] h-[58px] outline outline-4 outline-[#e2e2e2] border-0 inline-block text-[#e2e2e2] bg-[#3d7a33] text-[16px] mt-4"
            onClick={() => setShowSubstitutes(false)}
          >
            {t('teamPlayers.backToMainTeam')}
          </button>
        </div>
        <button
          className="w-[318px] h-[58px] outline outline-4 outline-[#e2e2e2] border-0 inline-block text-[#e2e2e2] bg-[#3d7a33] text-[16px] mt-4"
          onClick={() => setTeamSquadView(null)}
        >
          {t('teamPlayers.backToMatch')}
        </button>
      </div>
    </div>
  );
};

export default TeamPlayers;
