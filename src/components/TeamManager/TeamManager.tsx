import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralContext } from '../../contexts/GeneralContext';
import utils from '../../utils/utils';

export const FORMATIONS = [
  '5-3-2',
  '3-5-2',
  '4-4-2',
  '4-3-3',
  '4-2-4',
  '5-4-1',
  '3-4-3',
  '3-3-4',
];

// Enum for player selection state
enum PlayerSelectionState {
  Unselected = 0,
  Selected = 1,
  Substitute = 2,
}

const TeamManager: React.FC = () => {
  const { t } = useTranslation();
  const { getSelectedTeam, state } = useContext(GeneralContext);
  const [showFormationGrid, setShowFormationGrid] = useState(false);
  const [playerStates, setPlayerStates] = useState<{
    [id: string]: PlayerSelectionState;
  }>({});
  const [currentPage, setCurrentPage] = useState(0); // 0-based page index
  const PLAYERS_PER_PAGE = 11;

  useEffect(() => {
    getSelectedTeam();
  }, []);

  const handlePlayerClick = (id: string) => {
    setPlayerStates((prev) => {
      const player = state.selectedTeam?.players.find((p) => p.id === id);
      if (!player) return prev;
      const currentState = prev[id] ?? PlayerSelectionState.Unselected;
      // If this is a GK and trying to select, check if another GK is already selected
      if (
        player.position === 'GK' &&
        (currentState + 1) % 3 === PlayerSelectionState.Selected
      ) {
        const anotherGKSelected = state.selectedTeam?.players.some(
          (p) =>
            p.position === 'GK' &&
            p.id !== id &&
            (prev[p.id] ?? PlayerSelectionState.Unselected) ===
              PlayerSelectionState.Selected
        );
        if (anotherGKSelected) {
          // Don't allow selecting another GK
          return prev;
        }
      }
      const nextState = ((prev[id] ?? PlayerSelectionState.Unselected) + 1) % 3;
      return { ...prev, [id]: nextState };
    });
  };

  // Pagination logic
  const players = state.selectedTeam?.players || [];
  const totalPages = Math.ceil(players.length / PLAYERS_PER_PAGE);
  const paginatedPlayers = players.slice(
    currentPage * PLAYERS_PER_PAGE,
    (currentPage + 1) * PLAYERS_PER_PAGE
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    // Reset to first page if team changes or player count changes
    setCurrentPage(0);
  }, [state.selectedTeam?.id, players.length]);

  // Count selected players
  const selectedCount = Object.values(playerStates).filter(
    (state) => state === PlayerSelectionState.Selected
  ).length;

  // Calculate formation based on selected players
  const calculateFormation = () => {
    if (selectedCount !== 11) return null;

    const selectedPlayers =
      state.selectedTeam?.players.filter(
        (player) => playerStates[player.id] === PlayerSelectionState.Selected
      ) || [];

    const dfCount = selectedPlayers.filter((p) => p.position === 'DF').length;
    const mfCount = selectedPlayers.filter((p) => p.position === 'MF').length;
    const fwCount = selectedPlayers.filter((p) => p.position === 'FW').length;

    return `${dfCount}-${mfCount}-${fwCount}`;
  };

  // Function to check if a formation is available based on team's players
  const isFormationAvailable = (formation: string) => {
    const [df, mf, fw] = formation.split('-').map(Number);
    const players = state.selectedTeam?.players || [];

    const dfCount = players.filter((p) => p.position === 'DF').length;
    const mfCount = players.filter((p) => p.position === 'MF').length;
    const fwCount = players.filter((p) => p.position === 'FW').length;
    const gkCount = players.filter((p) => p.position === 'GK').length;

    return dfCount >= df && mfCount >= mf && fwCount >= fw && gkCount >= 1;
  };

  // Function to select best players for a formation
  const selectBestPlayersForFormation = (formation: string) => {
    const [df, mf, fw] = formation.split('-').map(Number);
    const players = state.selectedTeam?.players || [];

    // Reset all selections
    const newPlayerStates: { [id: string]: PlayerSelectionState } = {};

    // Select best GK
    const gks = players
      .filter((p) => p.position === 'GK')
      .sort((a, b) => b.strength - a.strength);
    if (gks.length > 0) {
      newPlayerStates[gks[0].id] = PlayerSelectionState.Selected;
    }

    // Select best defenders
    const defenders = players
      .filter((p) => p.position === 'DF')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, df);
    defenders.forEach((df) => {
      newPlayerStates[df.id] = PlayerSelectionState.Selected;
    });

    // Select best midfielders
    const midfielders = players
      .filter((p) => p.position === 'MF')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, mf);
    midfielders.forEach((mf) => {
      newPlayerStates[mf.id] = PlayerSelectionState.Selected;
    });

    // Select best forwards
    const forwards = players
      .filter((p) => p.position === 'FW')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, fw);
    forwards.forEach((fw) => {
      newPlayerStates[fw.id] = PlayerSelectionState.Selected;
    });

    // Select substitutes
    // First, get all players that weren't selected as starters
    const availablePlayers = players.filter((p) => !newPlayerStates[p.id]);

    // Select best GK substitute
    const gkSubs = availablePlayers
      .filter((p) => p.position === 'GK')
      .sort((a, b) => b.strength - a.strength);
    if (gkSubs.length > 0) {
      newPlayerStates[gkSubs[0].id] = PlayerSelectionState.Substitute;
    }

    // Select best DF substitutes (up to 2)
    const dfSubs = availablePlayers
      .filter((p) => p.position === 'DF')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 2);
    dfSubs.forEach((df) => {
      newPlayerStates[df.id] = PlayerSelectionState.Substitute;
    });

    // Select best MF substitutes (up to 2)
    const mfSubs = availablePlayers
      .filter((p) => p.position === 'MF')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 2);
    mfSubs.forEach((mf) => {
      newPlayerStates[mf.id] = PlayerSelectionState.Substitute;
    });

    // Select best FW substitutes (up to 2)
    const fwSubs = availablePlayers
      .filter((p) => p.position === 'FW')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 2);
    fwSubs.forEach((fw) => {
      newPlayerStates[fw.id] = PlayerSelectionState.Substitute;
    });

    setPlayerStates(newPlayerStates);
    setShowFormationGrid(false);
  };

  return (
    <div className="font-press-start min-h-screen bg-[#3d7a33]">
      <div className="bg-[#1e1e1e] border-4 border-[#e2e2e2] w-[350px] mx-auto mt-[26px] mb-[15px]">
        <div className="bg-[#1e1e1e] text-[#e2e2e2] text-center text-[20px] py-2 border-b-4 border-[#e2e2e2] uppercase">
          {state.selectedTeam?.name}
        </div>
        <div className="bg-[#1e1e1e] text-white text-center text-[18px] py-2 border-b-4 border-[#e2e2e2]">
          {showFormationGrid
            ? t('teamManager.chooseFormation')
            : selectedCount < 11
            ? t('teamManager.selectedCount', { count: selectedCount })
            : calculateFormation()}
        </div>
        {/* Player List or Formation Grid */}
        {showFormationGrid ? (
          <div className="bg-[#1e1e1e] text-white py-2 mx-2 mb-[50px] grid grid-cols-2 gap-4">
            {FORMATIONS.map((formation) => {
              const isAvailable = isFormationAvailable(formation);
              return (
                <button
                  key={formation}
                  className={`border-4 border-[#e2e2e2] ${
                    isAvailable
                      ? 'bg-[#1e1e1e] text-white hover:bg-[#2e2e2e]'
                      : 'bg-[#1e1e1e] text-gray-500 cursor-not-allowed'
                  } py-4 text-[18px] font-press-start`}
                  onClick={() =>
                    isAvailable && selectBestPlayersForFormation(formation)
                  }
                  disabled={!isAvailable}
                >
                  {formation}
                </button>
              );
            })}
            <button
              className="col-span-2 border-4 border-[#e2e2e2] bg-[#1e1e1e] text-white py-4 text-[18px] font-press-start mt-4"
              onClick={() => setShowFormationGrid(false)}
            >
              {t('teamManager.bestPlayers')}
            </button>
          </div>
        ) : (
          <div className="bg-[#1e1e1e] text-white py-2 mx-2 mb-[50px]">
            {paginatedPlayers.map((player) => {
              const selState =
                playerStates[player.id] ?? PlayerSelectionState.Unselected;
              return (
                <div
                  key={player.id}
                  className="flex justify-between items-center px-2 text-[15px] cursor-pointer"
                  onClick={() => handlePlayerClick(player.id)}
                >
                  <span
                    className={
                      selState === PlayerSelectionState.Selected
                        ? 'bg-[#e2e2e2] text-[#1e1e1e] px-2 my-[2px] mr-2 min-w-[36px] text-center'
                        : 'bg-transparent text-[#e2e2e2] px-2 my-[2px] mr-2 min-w-[36px] text-center'
                    }
                    style={{ transition: 'background 0.2s, color 0.2s' }}
                  >
                    {player.position}
                  </span>
                  <span
                    className={
                      selState === PlayerSelectionState.Substitute
                        ? 'flex-1 uppercase text-left underline decoration-2 decoration-[#e2e2e2] underline-offset-2'
                        : 'flex-1 uppercase text-left'
                    }
                  >
                    {player.name.length > 14
                      ? utils.shortenPlayerName(player.name)
                      : player.name}
                  </span>
                  <span className="ml-2">{player.strength}</span>
                </div>
              );
            })}
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
            <button
              className="w-1/2 border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-2 px-3 leading-[19px] text-[16px]"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              style={
                currentPage === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}
              }
            >
              {t('teamManager.prevPage')}
            </button>
            <button
              className="w-1/2 border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-2 px-3 leading-[19px] text-[16px]"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1 || totalPages === 0}
              style={
                currentPage === totalPages - 1 || totalPages === 0
                  ? { opacity: 0.5, cursor: 'not-allowed' }
                  : {}
              }
            >
              {t('teamManager.nextPage')}
            </button>
          </div>
          {selectedCount === 11 && (
            <button className="w-[350px] border-4 border-[#e2e2e2] bg-[#3c7a33] text-[#e2e2e2] py-4 text-[16px] mt-2">
              {t('teamManager.startMatch')}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default TeamManager;
