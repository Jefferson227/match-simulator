import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralContext } from '../../contexts/GeneralContext';
import utils from '../../utils/utils';

const FORMATIONS = [
  '5-3-2',
  '3-5-2',
  '4-4-2',
  '4-3-3',
  '4-2-4',
  '5-4-1',
  '3-4-3',
  '3-3-4',
];

const TeamManager: React.FC = () => {
  const { t } = useTranslation();
  const { getSelectedTeam, state } = useContext(GeneralContext);
  const [showFormationGrid, setShowFormationGrid] = useState(false);

  useEffect(() => {
    getSelectedTeam();
  }, []);

  return (
    <div className="font-press-start min-h-screen bg-[#3d7a33]">
      <div className="bg-[#1e1e1e] border-4 border-[#e2e2e2] w-[350px] mx-auto mt-[26px] mb-[15px]">
        <div className="bg-[#1e1e1e] text-[#e2e2e2] text-center text-[20px] py-2 border-b-4 border-[#e2e2e2] uppercase">
          {state.selectedTeam?.name}
        </div>
        <div className="bg-[#1e1e1e] text-white text-center text-[18px] py-2 border-b-4 border-[#e2e2e2]">
          {showFormationGrid
            ? t('teamManager.chooseFormation')
            : utils.getTeamFormation(state.selectedTeam)}
        </div>
        {/* Player List or Formation Grid */}
        {showFormationGrid ? (
          <div className="bg-[#1e1e1e] text-white py-2 mx-2 mb-[50px] grid grid-cols-2 gap-4">
            {FORMATIONS.map((formation) => (
              <button
                key={formation}
                className="border-4 border-[#e2e2e2] bg-[#1e1e1e] text-white py-4 text-[18px] font-press-start"
                onClick={() => setShowFormationGrid(false)}
              >
                {formation}
              </button>
            ))}
            <button
              className="col-span-2 border-4 border-[#e2e2e2] bg-[#1e1e1e] text-white py-4 text-[18px] font-press-start mt-4"
              onClick={() => setShowFormationGrid(false)}
            >
              {t('teamManager.bestPlayers')}
            </button>
          </div>
        ) : (
          <div className="bg-[#1e1e1e] text-white py-2 mx-2 mb-[50px]">
            {state.selectedTeam?.players?.map((player, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center px-2 text-[15px]"
              >
                <span className="bg-[#e2e2e2] text-[#1e1e1e] px-2 my-[2px] mr-2 min-w-[36px] text-center">
                  {player.position}
                </span>
                <span className="flex-1 uppercase text-left">
                  {player.name}
                </span>
                <span className="ml-2">{player.strength}</span>
              </div>
            ))}
          </div>
        )}
        {/* Choose Formation Button (only when not showing grid) */}
        {!showFormationGrid && (
          <div className="flex flex-col items-center gap-2 py-[17px]">
            <button
              className="w-[90%] border-[4px] border-[#e2e2e2] bg-[#1e1e1e] text-white py-[17px] text-[16px]"
              onClick={() => setShowFormationGrid(true)}
            >
              {t('teamManager.chooseFormation')}
            </button>
          </div>
        )}
      </div>
      {/* Navigation and Start Match Buttons, or Go Back button */}
      {showFormationGrid ? (
        <div className="flex flex-col items-center gap-2">
          <button
            className="w-[350px] border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-4 text-[16px]"
            onClick={() => setShowFormationGrid(false)}
          >
            {t('teamManager.goBack')}
          </button>
        </div>
      ) : (
        <>
          <div className="flex w-[350px] justify-between gap-2 mx-auto">
            <button className="w-1/2 border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-2 px-3 leading-[19px] text-[16px]">
              {t('teamManager.prevPage')}
            </button>
            <button className="w-1/2 border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-2 px-3 leading-[19px] text-[16px]">
              {t('teamManager.nextPage')}
            </button>
          </div>
          <button className="w-[350px] border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-4 text-[16px] mt-2">
            {t('teamManager.startMatch')}
          </button>
        </>
      )}
    </div>
  );
};

export default TeamManager;
