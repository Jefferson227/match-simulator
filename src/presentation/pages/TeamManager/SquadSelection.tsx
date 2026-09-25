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

type ViewMode = 'list' | 'detail';

// TODO: only strength and XP exist on Player; the rest are placeholders until the domain tracks them
const NOT_TRACKED = '-';

// Whether a player can be put straight into the given state, without cycling through the others
const canSetPlayerState = (
  prev: PlayerStates,
  players: Player[],
  player: Player,
  target: PlayerSelectionState
): boolean => {
  const current = prev[player.id] ?? PlayerSelectionState.Unselected;
  if (current === target) return true;

  if (target === PlayerSelectionState.Selected) {
    const starters = players.filter((p) => prev[p.id] === PlayerSelectionState.Selected);
    const hasGK = starters.some((p) => p.position === 'GK');
    if (starters.length >= MAX_STARTERS) return false;
    if (player.position === 'GK' && hasGK) return false;
    // The 11th starter must complete a lineup that has a GK
    if (starters.length === MAX_STARTERS - 1 && !hasGK && player.position !== 'GK') return false;
  }

  if (target === PlayerSelectionState.Substitute) {
    const substituteCount = Object.values(prev).filter(
      (state) => state === PlayerSelectionState.Substitute
    ).length;
    if (substituteCount >= MAX_SUBS) return false;
  }

  return true;
};

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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [detailIndex, setDetailIndex] = useState(0); // player shown in the detail view

  const players = team.players ?? [];
  const totalPages = Math.ceil(players.length / PLAYERS_PER_PAGE);
  const paginatedPlayers = players.slice(
    currentPage * PLAYERS_PER_PAGE,
    (currentPage + 1) * PLAYERS_PER_PAGE
  );
  const detailPlayer: Player | undefined = players[detailIndex];

  useEffect(() => {
    // Reset to first page if team changes or player count changes
    setCurrentPage(0);
    setDetailIndex(0);
  }, [team.id, players.length]);

  // Keep both views on the same stretch of the squad when switching between them
  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === viewMode) return;
    if (mode === 'detail') setDetailIndex(currentPage * PLAYERS_PER_PAGE);
    else setCurrentPage(Math.floor(detailIndex / PLAYERS_PER_PAGE));
    setViewMode(mode);
  };

  const handlePlayerStateChange = (player: Player, target: PlayerSelectionState) => {
    onPlayerStatesChange((prev) =>
      canSetPlayerState(prev, players, player, target) ? { ...prev, [player.id]: target } : prev
    );
  };

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

  // The arrows page through the list 11 at a time, or through the detail view one player at a time
  const isDetailView = viewMode === 'detail';
  const isFirstPage = isDetailView ? detailIndex === 0 : currentPage === 0;
  const isLastPage = isDetailView
    ? detailIndex >= players.length - 1
    : currentPage === totalPages - 1 || totalPages === 0;

  const handlePrevious = () =>
    isDetailView
      ? setDetailIndex((prev) => Math.max(prev - 1, 0))
      : setCurrentPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    isDetailView
      ? setDetailIndex((prev) => Math.min(prev + 1, players.length - 1))
      : setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));

  const viewModes: { mode: ViewMode; labelKey: string }[] = [
    { mode: 'list', labelKey: 'teamManager.listView' },
    { mode: 'detail', labelKey: 'teamManager.playerView' },
  ];

  const selectionOptions: { state: PlayerSelectionState; labelKey: string }[] = [
    { state: PlayerSelectionState.Selected, labelKey: 'teamManager.starter' },
    { state: PlayerSelectionState.Substitute, labelKey: 'teamManager.substitute' },
    { state: PlayerSelectionState.Unselected, labelKey: 'teamManager.none' },
  ];

  const renderPlayerList = () => (
    <div className="flex-1 py-2 mx-2" style={{ backgroundColor }}>
      {paginatedPlayers.map((player) => {
        const selState = playerStates[player.id] ?? PlayerSelectionState.Unselected;
        const isStarter = selState === PlayerSelectionState.Selected;
        const isSub = selState === PlayerSelectionState.Substitute;
        return (
          <div
            key={player.id}
            className="flex justify-between items-center px-2 text-[12px] cursor-pointer"
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
  );

  const renderPlayerDetail = () => {
    if (!detailPlayer) return <div className="flex-1" />;

    const selState = playerStates[detailPlayer.id] ?? PlayerSelectionState.Unselected;
    const stats: [string, string | number][] = [
      ['teamManager.playerStats.strength', detailPlayer.strength],
      ['teamManager.playerStats.xp', detailPlayer.xp],
      ['teamManager.playerStats.age', detailPlayer.age],
      ['teamManager.playerStats.matches', NOT_TRACKED],
      ['teamManager.playerStats.goals', NOT_TRACKED],
      ['teamManager.playerStats.yellowCards', NOT_TRACKED],
      ['teamManager.playerStats.redCards', NOT_TRACKED],
      ['teamManager.playerStats.injuries', NOT_TRACKED],
      ['teamManager.playerStats.mood', NOT_TRACKED],
      ['teamManager.playerStats.stamina', NOT_TRACKED],
    ];

    return (
      <div className="flex-1 flex flex-col py-2 mx-4 text-[12px]" style={{ color: nameColor }}>
        <div className="flex items-start gap-2 mb-2 leading-[18px]">
          <span
            className="px-2 min-w-[36px] text-center"
            style={{ backgroundColor: outlineColor, color: backgroundColor }}
          >
            {detailPlayer.position}
          </span>
          <span className="flex-1 uppercase">{detailPlayer.name}</span>
        </div>
        <div className="text-[10px] text-right mb-2">
          {detailIndex + 1}/{players.length}
        </div>

        {stats.map(([labelKey, value]) => (
          <div key={labelKey} className="flex justify-between uppercase leading-[22px]">
            <span>{t(labelKey)}</span>
            <span>{value}</span>
          </div>
        ))}

        <div
          role="radiogroup"
          aria-label={detailPlayer.name}
          className="flex justify-between gap-2 mt-auto"
        >
          {selectionOptions.map(({ state: optionState, labelKey }) => {
            const isChecked = selState === optionState;
            const isAvailable = canSetPlayerState(playerStates, players, detailPlayer, optionState);
            return (
              <button
                key={labelKey}
                role="radio"
                aria-checked={isChecked}
                disabled={!isAvailable}
                className="flex items-center gap-1 text-[10px] uppercase"
                style={{
                  color: nameColor,
                  opacity: isAvailable ? 1 : 0.5,
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                }}
                onClick={() => handlePlayerStateChange(detailPlayer, optionState)}
              >
                <span
                  className="inline-block w-[12px] h-[12px] border-2"
                  style={{
                    borderColor: outlineColor,
                    backgroundColor: isChecked ? outlineColor : 'transparent',
                  }}
                />
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-[350px] h-[700px] mx-auto flex flex-col"
      style={{ backgroundColor, border: `4px solid ${outlineColor}` }}
    >
      <div className="text-center text-[16px] py-2 uppercase" style={rowStyle}>
        {team.fullName}
      </div>
      <div className="text-center text-[16px] py-2" style={rowStyle}>
        {showFormationGrid
          ? t('teamManager.chooseFormation')
          : selectedCount < MAX_STARTERS
            ? t('teamManager.selectedCount', { count: selectedCount })
            : calculateFormation()}
      </div>

      {showFormationGrid ? (
        <>
          <div
            className="flex-1 py-2 mx-2 grid grid-cols-2 gap-4 content-center"
            style={{ backgroundColor }}
          >
            {FORMATIONS.map((formation) => {
              const isAvailable = isFormationAvailable(formation, players);
              return (
                <button
                  key={formation}
                  className={`border-4 py-4 text-[16px] font-press-start ${
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
              className="col-span-2 border-4 py-4 text-[16px] font-press-start mt-4"
              style={teamButtonStyle}
              onClick={() => setShowFormationGrid(false)}
            >
              {t('teamManager.bestPlayers')}
            </button>
          </div>
          <div className="flex flex-col items-center py-[17px]">
            <button
              className="w-[90%] border-[4px] py-[17px] text-[16px]"
              style={teamButtonStyle}
              onClick={() => setShowFormationGrid(false)}
            >
              {t('teamManager.goBack')}
            </button>
          </div>
        </>
      ) : (
        <>
          {isDetailView ? renderPlayerDetail() : renderPlayerList()}
          <div className="flex flex-col items-center gap-2 py-[17px]">
            <div role="radiogroup" className="w-[90%] flex">
              {viewModes.map(({ mode, labelKey }) => {
                const isChecked = viewMode === mode;
                return (
                  <button
                    key={mode}
                    role="radio"
                    aria-checked={isChecked}
                    className="w-1/2 border-[4px] py-2 text-[10px]"
                    style={{
                      borderColor: outlineColor,
                      backgroundColor: isChecked ? outlineColor : backgroundColor,
                      color: isChecked ? backgroundColor : nameColor,
                    }}
                    onClick={() => handleViewModeChange(mode)}
                  >
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
            <button
              className="w-[90%] border-[4px] py-[17px] text-[16px]"
              style={teamButtonStyle}
              onClick={() => setShowFormationGrid(true)}
            >
              {t('teamManager.chooseFormation')}
            </button>
            <div className="w-[90%] flex justify-between gap-2">
              <button
                className="w-1/3 border-[4px] py-[17px] text-[16px]"
                style={{
                  ...teamButtonStyle,
                  opacity: isFirstPage ? 0.5 : 1,
                  cursor: isFirstPage ? 'not-allowed' : 'pointer',
                }}
                onClick={handlePrevious}
                disabled={isFirstPage}
              >
                {'<'}
              </button>
              <button
                className="w-1/3 border-[4px] py-[17px] text-[10px]"
                style={teamButtonStyle}
                onClick={onGoBack}
              >
                {t('teamManager.goBack')}
              </button>
              <button
                className="w-1/3 border-[4px] py-[17px] text-[16px]"
                style={{
                  ...teamButtonStyle,
                  opacity: isLastPage ? 0.5 : 1,
                  cursor: isLastPage ? 'not-allowed' : 'pointer',
                }}
                onClick={handleNext}
                disabled={isLastPage}
              >
                {'>'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SquadSelection;
