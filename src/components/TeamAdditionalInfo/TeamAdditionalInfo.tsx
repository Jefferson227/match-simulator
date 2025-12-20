import React, { useContext, useState } from 'react';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import { GeneralContext } from '../../contexts/GeneralContext';
import generalService from '../../services/generalService';
import MainLayout from '../MainLayout/MainLayout';

const TeamAdditionalInfo: React.FC = () => {
  const { setScreenDisplayed, setViewingTeam } = useContext(GeneralContext);
  const [currentPage, setCurrentPage] = useState(1);
  const { state: championshipState, getTableStandings } = useChampionshipContext();

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
      return 'ST';
    }
    if (j === 2 && k !== 12) {
      return 'ND';
    }
    if (j === 3 && k !== 13) {
      return 'RD';
    }
    return 'TH';
  };

  // Get championship display name
  let championshipName = championshipState.selectedChampionship || '';
  if (championshipState.selectedChampionship) {
    const allChamps = generalService.getAllChampionships();
    const foundChamp = allChamps.find(
      (c) => c.internalName === championshipState.selectedChampionship
    );
    if (foundChamp) championshipName = foundChamp.name;
  }

  // Get team position from standings
  const standings = getTableStandings();
  const teamPosition = standings.find(
    (standing) => standing.teamAbbreviation === championshipState.humanPlayerBaseTeam?.abbreviation
  );
  const positionText = teamPosition
    ? `${
        standings.findIndex((s) => s.teamAbbreviation === teamPosition.teamAbbreviation) + 1
      }${getOrdinalSuffix(
        standings.findIndex((s) => s.teamAbbreviation === teamPosition.teamAbbreviation) + 1
      )} PLACE`
    : 'N/A';

  // Get next opponent from season calendar
  const currentRoundMatches = championshipState.seasonMatchCalendar.find(
    (round) => round.roundNumber === championshipState.currentRound
  );
  const nextMatch = currentRoundMatches?.matches.find(
    (match) =>
      match.homeTeam.id === championshipState.humanPlayerBaseTeam?.id ||
      match.awayTeam.id === championshipState.humanPlayerBaseTeam?.id
  );
  const nextOpponent = nextMatch
    ? nextMatch.homeTeam.id === championshipState.humanPlayerBaseTeam?.id
      ? nextMatch.awayTeam.shortName || nextMatch.awayTeam.name
      : nextMatch.homeTeam.shortName || nextMatch.homeTeam.name
    : 'N/A';

  // Get opponent team colors
  const opponentTeam = nextMatch
    ? nextMatch.homeTeam.id === championshipState.humanPlayerBaseTeam?.id
      ? nextMatch.awayTeam
      : nextMatch.homeTeam
    : null;

  const opponentColors = opponentTeam?.colors || {
    background: '#3b82f6',
    outline: '#ffffff',
    name: '#ffffff',
  };

  // Get next opponent position
  const nextOpponentPosition = nextMatch
    ? (() => {
        const opponentAbbr =
          nextMatch.homeTeam.id === championshipState.humanPlayerBaseTeam?.id
            ? nextMatch.awayTeam.abbreviation
            : nextMatch.homeTeam.abbreviation;
        const opponentStanding = standings.find((s) => s.teamAbbreviation === opponentAbbr);
        if (opponentStanding) {
          const position = standings.findIndex((s) => s.teamAbbreviation === opponentAbbr) + 1;
          return `${position}${getOrdinalSuffix(position)} PLACE`;
        }
        return 'N/A';
      })()
    : 'N/A';

  // Determine if human player team is playing at home or away
  const isHomeTeam = nextMatch
    ? nextMatch.homeTeam.id === championshipState.humanPlayerBaseTeam?.id
    : false;
  const matchLocation = isHomeTeam ? 'HOME' : 'AWAY';

  // Extract team colors with fallbacks
  const teamColors = championshipState.humanPlayerBaseTeam?.colors || {
    background: '#1e1e1e',
    outline: '#e2e2e2',
    name: '#e2e2e2',
  };
  // Button handlers
  const handleBack = () => {
    setScreenDisplayed('TeamManager');
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Render first page
  const renderFirstPage = () => (
    <>
      <div className="mb-5 p-3 bg-black/20 border-4 border-white">
        <div className="mb-2 text-[17px]">MORALE</div>
        <div className="w-full h-8 bg-[#316229] border-4 border-white my-2 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${
                (championshipState.humanPlayerBaseTeam?.morale || 0) <= 0
                  ? 0
                  : championshipState.humanPlayerBaseTeam?.morale
              }%`,
              backgroundColor: (() => {
                const morale = championshipState.humanPlayerBaseTeam?.morale || 0;
                if (morale <= 35) return '#ef4444'; // red
                if (morale < 65) return '#eab308'; // yellow
                return '#22c55e'; // green
              })(),
            }}
          />
        </div>
      </div>

      <div
        className="mb-5 p-3 bg-black/20 border-4 border-white cursor-pointer hover:bg-black/30 transition-colors"
        onClick={() => setScreenDisplayed('TeamStandings')}
        role="button"
        tabIndex={0}
        aria-label="Click to view championship details and top scorers"
      >
        <div className="flex flex-col gap-2 text-sm">
          <div>{championshipName}</div>
          <div>SEASON {championshipState.year}</div>
          <div>{`ROUND ${championshipState.currentRound} OF ${championshipState.seasonMatchCalendar.length}`}</div>
          <div>{positionText}</div>
        </div>
      </div>

      <div
        className="mb-5 p-3 bg-black/20 border-4 border-white cursor-pointer hover:bg-black/30 transition-colors"
        onClick={() => {
          setViewingTeam(opponentTeam);
          setScreenDisplayed('TeamViewer');
        }}
        role="button"
        tabIndex={0}
        aria-label="Click to view opponent team details"
      >
        <div className="mb-2 text-[17px]">NEXT MATCH</div>
        <div className="flex flex-col items-center">
          <div
            className="bg-blue-600 border-4 border-white w-[100%] mx-auto text-[17px] mb-2 flex justify-center items-center h-12 uppercase"
            style={{
              backgroundColor: opponentColors.background,
              borderColor: opponentColors.outline,
              color: opponentColors.name,
            }}
          >
            {nextOpponent}
          </div>
          <div className="text-xs opacity-80 flex justify-between w-full">
            <span className="text-left">{matchLocation}</span>
            <span className="text-right">{nextOpponentPosition}</span>
          </div>
        </div>
      </div>
    </>
  );

  // Render second page
  const renderSecondPage = () => (
    <>
      <div
        className="mb-5 p-3 bg-black/20 border-4 border-white"
        onClick={() => setScreenDisplayed('ChampionshipDetails')}
      >
        <div className="mb-3 text-[17px]">{championshipName}</div>
        <div className="mb-2 text-sm">TOP SCORERS</div>
      </div>

      <div
        className="mb-[12.375rem] p-3 bg-black/20 border-4 border-white"
        onClick={() => setScreenDisplayed('ChampionshipDetails')}
      >
        <div className="mb-3 text-[17px]">MY TEAM</div>
        <div className="mb-2 text-sm">TOP SCORERS</div>
      </div>
    </>
  );

  return (
    <MainLayout>
      <div
        className="p-2 text-center mb-5 border-4"
        style={{
          backgroundColor: teamColors.background,
          borderColor: teamColors.outline,
          color: teamColors.name,
        }}
      >
        <h2 className="m-0 text-[17px] uppercase tracking-wider">
          {championshipState.humanPlayerBaseTeam?.name || 'TEAM NAME'}
        </h2>
      </div>

      {currentPage === 1 ? renderFirstPage() : renderSecondPage()}

      <div className="flex justify-between mt-5">
        <button
          className={`h-[70px] w-1/3 bg-transparent border-4 border-white text-white px-4 py-2 me-2 font-press-start text-[16px] transition-all ${
            currentPage === 1
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white/20 active:translate-y-px'
          }`}
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        <button
          className="h-[70px] w-1/3 bg-transparent border-4 border-white text-white px-4 py-2 mx-2 font-press-start text-[16px] transition-all hover:bg-white/20 active:translate-y-px"
          onClick={handleBack}
        >
          BACK
        </button>
        <button
          className={`h-[70px] w-1/3 bg-transparent border-4 border-white text-white px-4 py-2 ms-2 font-press-start text-[16px] transition-all ${
            currentPage === 2
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white/20 active:translate-y-px'
          }`}
          onClick={handleNext}
          disabled={currentPage === 2}
        >
          &gt;
        </button>
      </div>
    </MainLayout>
  );
};

export default TeamAdditionalInfo;
