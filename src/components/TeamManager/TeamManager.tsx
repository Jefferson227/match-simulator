import React from 'react';
import { useTranslation } from 'react-i18next';

const selectedTeam = {
  name: 'CEARÁ SPORTING CLUB',
  formation: '4-3-3',
  players: [
    { position: 'GK', name: 'RICHARD', strength: 99 },
    { position: 'DF', name: 'DAVID RICARDO', strength: 99 },
    { position: 'DF', name: 'MATHEUS BAHIA', strength: 99 },
    { position: 'DF', name: 'MATHEUS FELIPE', strength: 99 },
    { position: 'DF', name: 'RAÍ RAMOS', strength: 99 },
    { position: 'MF', name: 'RICHARDSON', strength: 99 },
    { position: 'MF', name: 'LOURENÇO', strength: 99 },
    { position: 'MF', name: 'G. CASTILHO', strength: 99 },
    { position: 'FW', name: 'ERICK PULGA', strength: 99 },
    { position: 'FW', name: 'BARCELÓ', strength: 99 },
    { position: 'FW', name: 'AYLON', strength: 99 },
  ],
};

const TeamManager: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="font-press-start min-h-screen bg-[#3d7a33]">
      <div className="bg-[#1e1e1e] border-4 border-[#e2e2e2] w-[350px] mx-auto mt-[26px] mb-[15px]">
        <div className="bg-[#1e1e1e] text-[#e2e2e2] text-center text-[20px] py-2 border-b-4 border-[#e2e2e2]">
          {selectedTeam.name}
        </div>
        <div className="bg-[#1e1e1e] text-white text-center text-[18px] py-2 border-b-4 border-[#e2e2e2]">
          {selectedTeam.formation}
        </div>
        <div className="bg-[#1e1e1e] text-white py-2 mx-2 mb-[50px]">
          {selectedTeam.players.map((player, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center px-2 text-[15px]"
            >
              <span className="bg-[#e2e2e2] text-[#1e1e1e] px-2 my-[2px] mr-2 min-w-[36px] text-center">
                {player.position}
              </span>
              <span className="flex-1 uppercase text-left">{player.name}</span>
              <span className="ml-2">{player.strength}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2 py-[17px]">
          <button className="w-[90%] border-[4px] border-[#e2e2e2] bg-[#1e1e1e] text-white py-[17px] text-[16px]">
            {t('teamManager.chooseFormation')}
          </button>
        </div>
      </div>
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
    </div>
  );
};

export default TeamManager;
