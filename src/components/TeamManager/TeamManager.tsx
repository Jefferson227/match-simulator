import React from 'react';

const mockTeam = {
  name: 'CEARA SPORTING CLUB',
  formation: '4-3-3',
  players: [
    { position: 'GK', name: 'RICHARD', rating: 99 },
    { position: 'DF', name: 'DAVID RICARDO', rating: 99 },
    { position: 'DF', name: 'MATHEUS BAHIA', rating: 99 },
    { position: 'DF', name: 'MATHEUS FELIPE', rating: 99 },
    { position: 'DF', name: 'RAÍ RAMOS', rating: 99 },
    { position: 'MF', name: 'RICHARDSON', rating: 99 },
    { position: 'MF', name: 'LOURENÇO', rating: 99 },
    { position: 'MF', name: 'G. CASTILHO', rating: 99 },
    { position: 'FW', name: 'ERICK PULGA', rating: 99 },
    { position: 'FW', name: 'BARCELÓ', rating: 99 },
    { position: 'FW', name: 'AYLON', rating: 99 },
  ],
};

const TeamManager: React.FC = () => {
  return (
    <div className="font-press-start min-h-screen bg-[#3d7a33]">
      <div className="bg-[#1e1e1e] border-4 border-[#e2e2e2] w-[350px] mx-auto mt-[45px] mb-[15px]">
        <div className="bg-[#1e1e1e] text-[#e2e2e2] text-center text-[20px] py-2 border-b-4 border-[#e2e2e2]">
          {mockTeam.name}
        </div>
        <div className="bg-[#1e1e1e] text-white text-center text-[18px] py-2 border-b-4 border-[#e2e2e2]">
          {mockTeam.formation}
        </div>
        <div className="bg-[#1e1e1e] text-white py-2 mx-2 mb-[50px]">
          {mockTeam.players.map((player, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center px-2 text-[15px]"
            >
              <span className="bg-[#e2e2e2] text-[#1e1e1e] px-2 my-[2px] mr-2 min-w-[36px] text-center">
                {player.position}
              </span>
              <span className="flex-1 uppercase text-left">{player.name}</span>
              <span className="ml-2">{player.rating}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2 py-[17px]">
          <button className="w-[90%] border-[4px] border-[#e2e2e2] bg-[#1e1e1e] text-white py-[17px] text-[16px] hover:bg-[#222]">
            CHOOSE FORMATION
          </button>
        </div>
      </div>
      <div className="flex w-[350px] justify-between gap-2 mx-auto">
        <button className="w-1/2 border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-2 text-[13px] hover:bg-[#222]">
          PREV PAGE
        </button>
        <button className="w-1/2 border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-2 text-[13px] hover:bg-[#222]">
          NEXT PAGE
        </button>
      </div>
      <button className="w-[350px] border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-4 text-[17px] mt-2 hover:bg-[#222]">
        START MATCH
      </button>
    </div>
  );
};

export default TeamManager;
