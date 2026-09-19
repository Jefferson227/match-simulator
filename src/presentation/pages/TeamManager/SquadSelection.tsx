import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import utils from '../../../utils/utils';
import Player from '../../../domain/models/Player';
import { Team } from '../../../domain/models/Team';
import Formations, { FORMATIONS } from '../../../domain/enums/Formations';

export enum PlayerSelectionState {
  Unselected = 0,
  Selected = 1,
  Substitute = 2,
}

export type PlayerStates = { [id: string]: PlayerSelectionState };

const PLAYERS_PER_PAGE = 11;
const MAX_STARTERS = 11;
const MAX_SUBS = 7;
const MAX_SUBS_PER_POSITION = 2;

const strongestFirst = (a: Player, b: Player) => b.strength - a.strength;

const byPosition = (position: Player['position'], count: number, pool: Player[]) =>
  pool
    .filter((p) => p.position === position)
    .sort(strongestFirst)
    .slice(0, count);

export const countStarters = (playerStates: PlayerStates) =>
  Object.values(playerStates).filter((state) => state === PlayerSelectionState.Selected).length;

export const isFormationAvailable = (formation: Formations, players: Player[]) => {
  const [df, mf, fw] = formation.split('-').map(Number);
  return (
    players.filter((p) => p.position === 'GK').length >= 1 &&
    players.filter((p) => p.position === 'DF').length >= df &&
    players.filter((p) => p.position === 'MF').length >= mf &&
    players.filter((p) => p.position === 'FW').length >= fw
  );
};

// Strongest starters for the formation, then the strongest bench per position
export const selectBestPlayersForFormation = (
  formation: Formations | undefined,
  players: Player[]
): PlayerStates => {
  let starters: Player[];
  if (formation) {
    const [df, mf, fw] = formation.split('-').map(Number);
    starters = [
      ...byPosition('GK', 1, players),
      ...byPosition('DF', df, players),
      ...byPosition('MF', mf, players),
      ...byPosition('FW', fw, players),
    ];
  } else {
    starters = [...players].sort(strongestFirst).slice(0, MAX_STARTERS);
  }

  const starterIds = new Set(starters.map((player) => player.id));
  const availablePlayers = players.filter((player) => !starterIds.has(player.id));
  const subs = [
    ...byPosition('GK', 1, availablePlayers),
    ...byPosition('DF', MAX_SUBS_PER_POSITION, availablePlayers),
    ...byPosition('MF', MAX_SUBS_PER_POSITION, availablePlayers),
    ...byPosition('FW', MAX_SUBS_PER_POSITION, availablePlayers),
  ];

  const playerStates: PlayerStates = {};
  starters.forEach((player) => (playerStates[player.id] = PlayerSelectionState.Selected));
  subs.forEach((player) => (playerStates[player.id] = PlayerSelectionState.Substitute));
  return playerStates;
};

export const selectBestLineup = (players: Player[]): PlayerStates =>
  players.length
    ? selectBestPlayersForFormation(
        FORMATIONS.find((formation) => isFormationAvailable(formation, players)),
        players
      )
    : {};

interface SquadSelectionProps {
  team: Team;
  playerStates: PlayerStates;
  onPlayerStatesChange: (update: (prev: PlayerStates) => PlayerStates) => void;
  onGoBack: () => void;
}

const SquadSelection: React.FC<SquadSelectionProps> = ({
  team,
  playerStates,
  onPlayerStatesChange,
  onGoBack,
}) => {
  const { t } = useTranslation();

  const [showFormationGrid, setShowFormationGrid] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 0-based page index

  const players = team.players ?? [];
  const totalPages = Math.ceil(players.length / PLAYERS_PER_PAGE);
  const paginatedPlayers = players.slice(
    currentPage * PLAYERS_PER_PAGE,
    (currentPage + 1) * PLAYERS_PER_PAGE
  );

  useEffect(() => {
    // Reset to first page if team changes or player count changes
    setCurrentPage(0);
  }, [team.id, players.length]);

  const handlePlayerClick = (id: string) => {
    onPlayerStatesChange((prev) => {
      const player = players.find((p: Player) => p.id === id);
      if (!player) return prev;
      const currentState = prev[id] ?? PlayerSelectionState.Unselected;

      const selectedCount = countStarters(prev);
      const substituteCount = Object.values(prev).filter(
        (state) => state === PlayerSelectionState.Substitute
      ).length;

      const hasGKSelected = players.some(
        (p: Player) =>
          p.position === 'GK' &&
          (prev[p.id] ?? PlayerSelectionState.Unselected) === PlayerSelectionState.Selected
      );

      // Only one GK can start
      if (player.position === 'GK' && (currentState + 1) % 3 === PlayerSelectionState.Selected) {
        const anotherGKSelected = players.some(
          (p: Player) =>
            p.position === 'GK' &&
            p.id !== id &&
            (prev[p.id] ?? PlayerSelectionState.Unselected) === PlayerSelectionState.Selected
        );
        if (anotherGKSelected) return prev;
      }

      // Don't allow deselecting the only GK of a full lineup
      if (
        player.position === 'GK' &&
        currentState === PlayerSelectionState.Selected &&
        selectedCount === MAX_STARTERS
      ) {
        return prev;
      }

      // Below the starter limit: cycle unselected -> starter -> substitute
      if (selectedCount < MAX_STARTERS) {
        const nextState = (currentState + 1) % 3;
        // The 11th starter must complete a lineup that has a GK
        if (nextState === PlayerSelectionState.Selected && selectedCount === MAX_STARTERS - 1) {
          if (!hasGKSelected && player.position !== 'GK') return prev;
        }
        return { ...prev, [id]: nextState };
      }

      // At the starter limit: only cycle between unselected and substitute
      if (currentState === PlayerSelectionState.Unselected) {
        if (substituteCount < MAX_SUBS) {
          return { ...prev, [id]: PlayerSelectionState.Substitute };
        }
      } else if (currentState === PlayerSelectionState.Substitute) {
        return { ...prev, [id]: PlayerSelectionState.Unselected };
      } else if (currentState === PlayerSelectionState.Selected) {
        if (!hasGKSelected) return prev;
        return { ...prev, [id]: PlayerSelectionState.Unselected };
      }

      return prev;
    });
  };

  const handleFormationClick = (formation: Formations) => {
    onPlayerStatesChange(() => selectBestPlayersForFormation(formation, players));
    setShowFormationGrid(false);
  };

  const selectedCount = countStarters(playerStates);

  const calculateFormation = () => {
    const starters = players.filter(
      (player) => playerStates[player.id] === PlayerSelectionState.Selected
    );
    const dfCount = starters.filter((p) => p.position === 'DF').length;
    const mfCount = starters.filter((p) => p.position === 'MF').length;
    const fwCount = starters.filter((p) => p.position === 'FW').length;

    return `${dfCount}-${mfCount}-${fwCount}`;
  };

  const backgroundColor = team.colors.background;
  const outlineColor = team.colors.outline;
  const nameColor = team.colors.text;

  const rowStyle = {
    backgroundColor,
    color: nameColor,
    borderBottom: `4px solid ${outlineColor}`,
  };

  const teamButtonStyle = {
    borderColor: outlineColor,
    backgroundColor,
    color: nameColor,
  };

  const navButtonStyle = {
    borderColor: '#e2e2e2',
    backgroundColor: '#3c7a33',
    color: '#e2e2e2',
  };

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1 || totalPages === 0;

  return (
    <>
      <div
        className="w-[350px] mx-auto"
        style={{ backgroundColor, border: `4px solid ${outlineColor}` }}
      >
        <div className="text-center text-[20px] py-2 uppercase" style={rowStyle}>
          {team.fullName}
        </div>
        <div className="text-center text-[18px] py-2" style={rowStyle}>
          {showFormationGrid
            ? t('teamManager.chooseFormation')
            : selectedCount < MAX_STARTERS
              ? t('teamManager.selectedCount', { count: selectedCount })
              : calculateFormation()}
        </div>

        {showFormationGrid ? (
          <div className="py-2 mx-2 mb-[50px] grid grid-cols-2 gap-4" style={{ backgroundColor }}>
            {FORMATIONS.map((formation) => {
              const isAvailable = isFormationAvailable(formation, players);
              return (
                <button
                  key={formation}
                  className={`border-4 py-4 text-[18px] font-press-start ${
                    isAvailable ? '' : 'cursor-not-allowed'
                  }`}
                  style={{ ...teamButtonStyle, color: isAvailable ? nameColor : '#888' }}
                  onClick={() => isAvailable && handleFormationClick(formation)}
                  disabled={!isAvailable}
                >
                  {formation}
                </button>
              );
            })}
            <button
              className="col-span-2 border-4 py-4 text-[18px] font-press-start mt-4"
              style={teamButtonStyle}
              onClick={() => setShowFormationGrid(false)}
            >
              {t('teamManager.bestPlayers')}
            </button>
          </div>
        ) : (
          <>
            <div className="py-2 mx-2 h-[307.5px]" style={{ backgroundColor }}>
              {paginatedPlayers.map((player) => {
                const selState = playerStates[player.id] ?? PlayerSelectionState.Unselected;
                const isStarter = selState === PlayerSelectionState.Selected;
                const isSub = selState === PlayerSelectionState.Substitute;
                return (
                  <div
                    key={player.id}
                    className="flex justify-between items-center px-2 text-[15px] cursor-pointer"
                    onClick={() => handlePlayerClick(player.id)}
                  >
                    <span
                      className="px-2 my-[2px] mr-2 min-w-[36px] text-center"
                      style={{
                        backgroundColor: isStarter ? outlineColor : 'transparent',
                        color: isStarter ? backgroundColor : nameColor,
                        transition: 'background 0.2s, color 0.2s',
                      }}
                    >
                      {player.position}
                    </span>
                    <span
                      className={`flex-1 uppercase text-left ${
                        isSub ? 'underline decoration-2 underline-offset-2' : ''
                      }`}
                      style={{ color: nameColor, textDecorationColor: outlineColor }}
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
            <div className="flex flex-col items-center gap-2 py-[17px]">
              <button
                className="w-[90%] border-[4px] py-[17px] text-[16px]"
                style={teamButtonStyle}
                onClick={() => setShowFormationGrid(true)}
              >
                {t('teamManager.chooseFormation')}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-[10px]">
        {showFormationGrid ? (
          <div className="flex flex-col items-center gap-2">
            <button
              className="w-[350px] border-4 py-4 text-[16px]"
              style={navButtonStyle}
              onClick={() => setShowFormationGrid(false)}
            >
              {t('teamManager.goBack')}
            </button>
          </div>
        ) : (
          <div className="flex w-[350px] justify-between gap-2 mx-auto">
            <button
              className="w-1/3 h-[70px] border-4 py-2 px-3 leading-[19px] text-[16px]"
              style={{
                ...navButtonStyle,
                opacity: isFirstPage ? 0.5 : 1,
                cursor: isFirstPage ? 'not-allowed' : 'pointer',
              }}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={isFirstPage}
            >
              {'<'}
            </button>
            <button
              className="w-1/3 h-[70px] border-4 py-2 px-3 leading-[19px] text-[16px]"
              style={navButtonStyle}
              onClick={onGoBack}
            >
              {t('teamManager.goBack')}
            </button>
            <button
              className="w-1/3 h-[70px] border-4 py-2 px-3 leading-[19px] text-[16px]"
              style={{
                ...navButtonStyle,
                opacity: isLastPage ? 0.5 : 1,
                cursor: isLastPage ? 'not-allowed' : 'pointer',
              }}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
              disabled={isLastPage}
            >
              {'>'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SquadSelection;
