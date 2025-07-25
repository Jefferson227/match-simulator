import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import { generateSeasonMatchCalendar } from '../../services/teamService';
import utils from '../../utils/utils';
import { MatchTeam, Player } from '../../types';

export const FORMATIONS = ['5-3-2', '3-5-2', '4-4-2', '4-3-3', '4-2-4', '5-4-1', '3-4-3', '3-3-4'];

// Enum for player selection state
enum PlayerSelectionState {
  Unselected = 0,
  Selected = 1,
  Substitute = 2,
}

const TeamManager: React.FC = () => {
  const { t } = useTranslation();
  const { setMatchTeam, setScreenDisplayed } = useContext(GeneralContext);
  const {
    state: championshipState,
    incrementCurrentRound,
    setCurrentRound,
    setSeasonMatchCalendar,
    incrementYear,
  } = useChampionshipContext();
  const [showFormationGrid, setShowFormationGrid] = useState(false);
  const [playerStates, setPlayerStates] = useState<{
    [id: string]: PlayerSelectionState;
  }>({});
  const [currentPage, setCurrentPage] = useState(0); // 0-based page index
  const PLAYERS_PER_PAGE = 11;

  // Get the human player's base team from championship context
  const baseTeam = championshipState.humanPlayerBaseTeam;

  const handlePlayerClick = (id: string) => {
    setPlayerStates((prev) => {
      const player = baseTeam?.players.find((p: Player) => p.id === id);
      if (!player) return prev;
      const currentState = prev[id] ?? PlayerSelectionState.Unselected;

      // Count current selections
      const selectedCount = Object.values(prev).filter(
        (state) => state === PlayerSelectionState.Selected
      ).length;
      const substituteCount = Object.values(prev).filter(
        (state) => state === PlayerSelectionState.Substitute
      ).length;

      // Check if there's a GK selected
      const hasGKSelected = baseTeam?.players.some(
        (p: Player) =>
          p.position === 'GK' &&
          (prev[p.id] ?? PlayerSelectionState.Unselected) === PlayerSelectionState.Selected
      );

      // If this is a GK and trying to select, check if another GK is already selected
      if (player.position === 'GK' && (currentState + 1) % 3 === PlayerSelectionState.Selected) {
        const anotherGKSelected = baseTeam?.players.some(
          (p: Player) =>
            p.position === 'GK' &&
            p.id !== id &&
            (prev[p.id] ?? PlayerSelectionState.Unselected) === PlayerSelectionState.Selected
        );
        if (anotherGKSelected) {
          // Don't allow selecting another GK
          return prev;
        }
      }

      // If trying to deselect a GK, check if it's the only GK selected
      if (
        player.position === 'GK' &&
        currentState === PlayerSelectionState.Selected &&
        selectedCount === 11
      ) {
        // Don't allow deselecting the only GK if we have 11 players
        return prev;
      }

      // If we haven't reached the player limit yet, use the tri-state cycle
      if (selectedCount < 11) {
        const nextState = ((prev[id] ?? PlayerSelectionState.Unselected) + 1) % 3;
        // If trying to select as starter (not substitute or unselect)
        if (nextState === PlayerSelectionState.Selected) {
          // If this would be the 11th selected player
          if (selectedCount === 10) {
            // Check if a GK is already selected (including this one if it's a GK)
            const willBeGK = player.position === 'GK';
            const gkAlreadySelected = baseTeam?.players.some(
              (p: Player) =>
                p.position === 'GK' &&
                (p.id === id && !willBeGK
                  ? false
                  : (prev[p.id] ?? PlayerSelectionState.Unselected) ===
                      PlayerSelectionState.Selected ||
                    (p.id === id && willBeGK))
            );
            // If no GK is selected and this is not a GK, block selection
            if (!gkAlreadySelected && !willBeGK) {
              return prev;
            }
          }
        }
        return { ...prev, [id]: nextState };
      }

      // If we've reached the player limit, only allow cycling between unselected and substitute
      if (currentState === PlayerSelectionState.Unselected) {
        // Only allow selecting as substitute if we haven't reached the substitute limit
        if (substituteCount < 7) {
          return { ...prev, [id]: PlayerSelectionState.Substitute };
        }
      } else if (currentState === PlayerSelectionState.Substitute) {
        // Always allow deselecting a substitute
        return { ...prev, [id]: PlayerSelectionState.Unselected };
      } else if (currentState === PlayerSelectionState.Selected) {
        // If currently selected, only allow cycling to unselected if it's not the only GK
        if (player.position === 'GK' && selectedCount === 11) {
          return prev;
        }
        // If we have 11 players and no GK selected, don't allow deselecting
        if (selectedCount === 11 && !hasGKSelected) {
          return prev;
        }
        return { ...prev, [id]: PlayerSelectionState.Unselected };
      }

      return prev;
    });
  };

  // Pagination logic
  const players = baseTeam?.players || [];
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
  }, [baseTeam?.id, players.length]);

  // Count selected players
  const selectedCount = Object.values(playerStates).filter(
    (state) => state === PlayerSelectionState.Selected
  ).length;

  // Calculate formation based on selected players
  const calculateFormation = () => {
    if (selectedCount !== 11) return null;

    const selectedPlayers =
      baseTeam?.players.filter(
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
    const players = baseTeam?.players || [];

    const dfCount = players.filter((p) => p.position === 'DF').length;
    const mfCount = players.filter((p) => p.position === 'MF').length;
    const fwCount = players.filter((p) => p.position === 'FW').length;
    const gkCount = players.filter((p) => p.position === 'GK').length;

    return dfCount >= df && mfCount >= mf && fwCount >= fw && gkCount >= 1;
  };

  // Function to select best players for a formation
  const selectBestPlayersForFormation = (formation: string) => {
    const [df, mf, fw] = formation.split('-').map(Number);
    const players = baseTeam?.players || [];

    // Reset all selections
    const newPlayerStates: { [id: string]: PlayerSelectionState } = {};

    // Select best GK
    const gks = players.filter((p) => p.position === 'GK').sort((a, b) => b.strength - a.strength);
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

  const createMatchTeam = (): MatchTeam | null => {
    if (!baseTeam || selectedCount !== 11) return null;

    const starters = baseTeam.players.filter(
      (player) => playerStates[player.id] === PlayerSelectionState.Selected
    );
    const substitutes = baseTeam.players.filter(
      (player) => playerStates[player.id] === PlayerSelectionState.Substitute
    );

    return {
      ...baseTeam,
      starters,
      substitutes,
      score: 0,
      isHomeTeam: true,
    };
  };

  const handleStartMatch = () => {
    const matchTeam = createMatchTeam();
    if (matchTeam) {
      setMatchTeam(matchTeam);
      setScreenDisplayed('MatchSimulator');
    }
  };

  // Extract team colors with fallbacks
  const teamColors = baseTeam?.colors || {
    background: '#1e1e1e',
    outline: '#e2e2e2',
    name: '#e2e2e2',
  };
  const backgroundColor = teamColors.background || '#1e1e1e';
  const outlineColor = teamColors.outline || '#e2e2e2';
  const nameColor = teamColors.name || '#e2e2e2';

  return (
    <div className="font-press-start min-h-screen" style={{ backgroundColor: '#3d7a33' }}>
      <div
        className="w-[350px] mx-auto mt-[26px] mb-[15px]"
        style={{ backgroundColor, border: `4px solid ${outlineColor}` }}
      >
        <div
          className="text-center text-[20px] py-2 uppercase"
          style={{
            backgroundColor,
            color: nameColor,
            borderBottom: `4px solid ${outlineColor}`,
          }}
        >
          {baseTeam?.name}
        </div>
        <div
          className="text-center text-[18px] py-2"
          style={{
            backgroundColor,
            color: nameColor,
            borderBottom: `4px solid ${outlineColor}`,
          }}
        >
          {showFormationGrid
            ? t('teamManager.chooseFormation')
            : selectedCount < 11
            ? t('teamManager.selectedCount', { count: selectedCount })
            : calculateFormation()}
        </div>
        {/* Player List or Formation Grid */}
        {showFormationGrid ? (
          <div
            className="py-2 mx-2 mb-[50px] grid grid-cols-2 gap-4"
            style={{ backgroundColor, color: '#fff' }}
          >
            {FORMATIONS.map((formation) => {
              const isAvailable = isFormationAvailable(formation);
              return (
                <button
                  key={formation}
                  className={`border-4 py-4 text-[18px] font-press-start ${
                    isAvailable ? '' : 'text-gray-500 cursor-not-allowed'
                  }`}
                  style={{
                    borderColor: outlineColor,
                    backgroundColor,
                    color: isAvailable ? nameColor : '#888',
                    ...(isAvailable && {
                      transition: 'background 0.2s',
                    }),
                  }}
                  onClick={() => isAvailable && selectBestPlayersForFormation(formation)}
                  disabled={!isAvailable}
                >
                  {formation}
                </button>
              );
            })}
            <button
              className="col-span-2 border-4 py-4 text-[18px] font-press-start mt-4"
              style={{
                borderColor: outlineColor,
                backgroundColor,
                color: nameColor,
              }}
              onClick={() => setShowFormationGrid(false)}
            >
              {t('teamManager.bestPlayers')}
            </button>
          </div>
        ) : (
          <div
            className="py-2 mx-2 mb-[50px] h-[307.5px]"
            style={{ backgroundColor, color: '#fff' }}
          >
            {paginatedPlayers.map((player) => {
              const selState = playerStates[player.id] ?? PlayerSelectionState.Unselected;
              return (
                <div
                  key={player.id}
                  className="flex justify-between items-center px-2 text-[15px] cursor-pointer"
                  onClick={() => handlePlayerClick(player.id)}
                >
                  <span
                    className={
                      selState === PlayerSelectionState.Selected
                        ? 'px-2 my-[2px] mr-2 min-w-[36px] text-center'
                        : 'bg-transparent px-2 my-[2px] mr-2 min-w-[36px] text-center'
                    }
                    style={
                      selState === PlayerSelectionState.Selected
                        ? {
                            backgroundColor: outlineColor,
                            color: backgroundColor,
                            transition: 'background 0.2s, color 0.2s',
                          }
                        : {
                            color: nameColor,
                            transition: 'background 0.2s, color 0.2s',
                          }
                    }
                  >
                    {player.position}
                  </span>
                  <span
                    className={
                      selState === PlayerSelectionState.Substitute
                        ? 'flex-1 uppercase text-left underline decoration-2 underline-offset-2'
                        : 'flex-1 uppercase text-left'
                    }
                    style={
                      selState === PlayerSelectionState.Substitute
                        ? {
                            textDecorationColor: outlineColor,
                            color: nameColor,
                          }
                        : { color: nameColor }
                    }
                  >
                    {player.name.length > 14 ? utils.shortenPlayerName(player.name) : player.name}
                  </span>
                  <span className="ml-2" style={{ color: nameColor }}>
                    {player.strength}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {/* Choose Formation Button (only when not showing grid) */}
        {!showFormationGrid && (
          <div className="flex flex-col items-center gap-2 py-[17px]">
            <button
              className="w-[90%] border-[4px] py-[17px] text-[16px]"
              style={{
                borderColor: outlineColor,
                backgroundColor,
                color: nameColor,
              }}
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
            className="w-[350px] border-4 py-4 text-[16px]"
            style={{
              borderColor: '#e2e2e2',
              backgroundColor: '#3c7a33',
              color: '#e2e2e2',
            }}
            onClick={() => setShowFormationGrid(false)}
          >
            {t('teamManager.goBack')}
          </button>
        </div>
      ) : (
        <>
          <div className="flex w-[350px] justify-between gap-2 mx-auto">
            <button
              className="w-1/3 h-[70px] border-4 py-2 px-3 leading-[19px] text-[16px]"
              style={{
                borderColor: '#e2e2e2',
                backgroundColor: '#3c7a33',
                color: '#e2e2e2',
                opacity: currentPage === 0 ? 0.5 : 1,
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              }}
              onClick={handlePrevPage}
              disabled={currentPage === 0}
            >
              {'<'}
            </button>
            <button
              className="w-1/3 h-[70px] border-4 py-2 px-3 leading-[19px] text-[16px]"
              style={{
                borderColor: '#e2e2e2',
                backgroundColor: '#3c7a33',
                color: '#e2e2e2',
              }}
              onClick={() => setScreenDisplayed('TeamAdditionalInfo')}
            >
              {t('teamManager.moreInfo')}
            </button>
            <button
              className="w-1/3 h-[70px] border-4 py-2 px-3 leading-[19px] text-[16px]"
              style={{
                borderColor: '#e2e2e2',
                backgroundColor: '#3c7a33',
                color: '#e2e2e2',
                opacity: currentPage === totalPages - 1 || totalPages === 0 ? 0.5 : 1,
                cursor:
                  currentPage === totalPages - 1 || totalPages === 0 ? 'not-allowed' : 'pointer',
              }}
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1 || totalPages === 0}
            >
              {'>'}
            </button>
          </div>
          {selectedCount === 11 && (
            <div className="w-[350px] mx-auto mt-2">
              <button
                className="w-full border-4 py-4 text-[16px]"
                style={{
                  borderColor: '#e2e2e2',
                  backgroundColor: '#3c7a33',
                  color: '#e2e2e2',
                }}
                onClick={handleStartMatch}
              >
                {t('teamManager.startMatch')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamManager;
