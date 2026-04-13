import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import utils from '../../utils/utils';
import { Team } from '../../domain/models/Team';
import Player from '../../domain/models/Player';
import { GameEngine } from '../../../game-engine/GameEngine';

interface TeamPlayersProps {
  team: Team;
  matchId: string;
  engine: GameEngine;
  runFunction: () => void;
}

const TeamMatchDetails: FC<TeamPlayersProps> = ({ team, matchId, engine, runFunction }) => {
  const { t } = useTranslation();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedSubstitute, setSelectedSubstitute] = useState<Player | null>(null);
  const [showSubstitutes, setShowSubstitutes] = useState<boolean>(false);

  return (
    <div className="font-press-start">
      <div
        className="w-[350px] h-[596px] mx-auto relative outline outline-4"
        style={{
          backgroundColor: team.colors.background,
          outlineColor: team.colors.outline,
        }}
      >
        <div
          className="max-h-[80px] border-b-3 text-[17px] py-[10px] px-[22px] text-center uppercase"
          style={{
            color: team.colors.text,
            borderColor: team.colors.outline,
          }}
        >
          {team.fullName}
        </div>
        <div
          className="max-h-[60px] border-b-3 text-[16px] py-[10px] px-[22px] text-[#e2e2e2] text-center"
          style={{
            color: team.colors.text,
            borderColor: team.colors.outline,
          }}
        >
          {utils.getTeamFormation(team.players)}
        </div>
        <div className={showSubstitutes ? 'hidden' : 'block mt-[10px]'}>
          {team.players
            .filter((player) => player.isStarter)
            .map((starter) => (
              <div
                className="text-[14px] flex justify-between py-0.5 px-6 uppercase cursor-pointer"
                key={starter.id}
                style={{
                  color:
                    starter.id === selectedPlayer?.id ? team.colors.background : team.colors.text,
                  backgroundColor:
                    starter.id === selectedPlayer?.id ? team.colors.text : team.colors.background,
                }}
                onClick={() =>
                  starter.id !== selectedPlayer?.id
                    ? setSelectedPlayer(starter)
                    : setSelectedPlayer(null)
                }
              >
                <div className="w-8">{t(`teamPlayers.positions.${starter.position}`)}</div>
                <div className="w-[200px] text-left">{utils.shortenPlayerName(starter.name)}</div>
                <div className="w-8">{starter.strength}</div>
              </div>
            ))}
        </div>
        <div
          className={
            showSubstitutes && team.players.filter((player) => player.isSub)
              ? 'block mt-[10px]'
              : 'hidden'
          }
        >
          {team.players
            .filter((player) => player.isSub)
            .map((substitute) => (
              <div
                className="text-[14px] flex justify-between py-0.5 px-6 uppercase cursor-pointer"
                key={substitute.id}
                style={{
                  color:
                    substitute.id === selectedSubstitute?.id
                      ? team.colors.background
                      : team.colors.text,
                  backgroundColor:
                    substitute.id === selectedSubstitute?.id
                      ? team.colors.text
                      : team.colors.background,
                }}
                onClick={() =>
                  substitute.id !== selectedSubstitute?.id
                    ? setSelectedSubstitute(substitute)
                    : setSelectedSubstitute(null)
                }
              >
                <div className="w-8">{t(`teamPlayers.positions.${substitute.position}`)}</div>
                <div className="w-[200px] text-left">
                  {utils.shortenPlayerName(substitute.name)}
                </div>
                <div className="w-8">{substitute.strength}</div>
              </div>
            ))}
        </div>
        <div
          className={`absolute bottom-0 left-0 w-full mb-[15px] ${
            showSubstitutes ? 'hidden' : 'block'
          }`}
        >
          <div className="w-[350px] mx-auto">
            <button
              className="w-[322px] h-[58px] text-[16px] border-0 outline outline-4 mx-auto block"
              style={{
                backgroundColor: team.colors.background,
                outlineColor: team.colors.outline,
                color: team.colors.text,
              }}
              onClick={() => setShowSubstitutes(true)}
            >
              {t('teamPlayers.seeSubstitutes')}
            </button>
          </div>
        </div>

        <div
          className={
            showSubstitutes && selectedPlayer && selectedSubstitute
              ? 'absolute bottom-0 left-0 w-full mb-[15px] block'
              : 'hidden'
          }
        >
          <div className="w-[350px] mx-auto">
            <button
              className="w-[322px] h-[58px] text-[16px] border-0 outline outline-4 mx-auto block"
              style={{
                backgroundColor: team.colors.background,
                outlineColor: team.colors.outline,
                color: team.colors.text,
              }}
              onClick={() => {
                if (selectedPlayer && selectedSubstitute) {
                  engine.dispatch({
                    type: 'SUBSTITUTE_PLAYER',
                    team,
                    matchId,
                    player: selectedPlayer,
                    sub: selectedSubstitute,
                  });
                  setSelectedPlayer(null);
                  setSelectedSubstitute(null);
                  setShowSubstitutes(false);
                }
              }}
            >
              {t('teamPlayers.confirmSubstitution')}
            </button>
          </div>
        </div>
      </div>

      <div className="w-[350px] mx-auto mt-[4px] flex justify-between gap-0">
        <button
          className={`${
            showSubstitutes ? 'inline-block' : 'hidden'
          } w-[159px] h-[58px] outline outline-4 outline-[#e2e2e2] border-0 text-[#e2e2e2] bg-[#3d7a33] text-[16px] mt-4`}
          onClick={() => setShowSubstitutes(false)}
        >
          {t('teamPlayers.backToMainTeam')}
        </button>
        <button
          className={`${
            showSubstitutes ? 'w-[159px]' : 'w-full'
          } h-[58px] outline outline-4 outline-[#e2e2e2] border-0 text-[#e2e2e2] bg-[#3d7a33] text-[16px] mt-4`}
          onClick={runFunction}
        >
          {t('teamPlayers.backToMatch')}
        </button>
      </div>
    </div>
  );
};

export default TeamMatchDetails;
