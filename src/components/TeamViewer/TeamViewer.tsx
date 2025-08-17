import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import utils from '../../utils/utils';

const TeamViewer: React.FC = () => {
  const { t } = useTranslation();
  const { setScreenDisplayed } = useContext(GeneralContext);
  const {
    state: championshipState,
  } = useChampionshipContext();
  const [currentPage, setCurrentPage] = useState(0);
  const PLAYERS_PER_PAGE = 11;

  // Get the human player's base team from championship context
  const baseTeam = championshipState.humanPlayerBaseTeam;

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

  const handleBack = () => {
    setScreenDisplayed('TeamAdditionalInfo');
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
        
        {/* Morale Graph Section */}
        <div
          className="p-3 mx-2 mt-2"
          style={{
            backgroundColor,
            borderBottom: `4px solid ${outlineColor}`,
          }}
        >
          <div className="mb-2 text-[17px]" style={{ color: nameColor }}>
            MORALE
          </div>
          <div className="w-full h-8 bg-[#316229] border-4 border-white my-2 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${baseTeam?.morale || 0}%`,
                backgroundColor: (() => {
                  const morale = baseTeam?.morale || 0;
                  if (morale <= 35) return '#ef4444'; // red
                  if (morale < 65) return '#eab308'; // yellow
                  return '#22c55e'; // green
                })(),
              }}
            />
          </div>
        </div>

        {/* Player List */}
        <div
          className="py-2 mx-2 mb-[50px] h-[307.5px]"
          style={{ backgroundColor, color: '#fff' }}
        >
          {paginatedPlayers.map((player) => (
            <div
              key={player.id}
              className="flex justify-between items-center px-2 text-[15px]"
            >
              <span
                className="px-2 my-[2px] mr-2 min-w-[36px] text-center"
                style={{
                  backgroundColor: outlineColor,
                  color: backgroundColor,
                }}
              >
                {player.position}
              </span>
              <span
                className="flex-1 uppercase text-left"
                style={{ color: nameColor }}
              >
                {player.name.length > 14 ? utils.shortenPlayerName(player.name) : player.name}
              </span>
              <span className="ml-2" style={{ color: nameColor }}>
                {player.strength}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
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
          onClick={handleBack}
        >
          BACK
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
    </div>
  );
};

export default TeamViewer;