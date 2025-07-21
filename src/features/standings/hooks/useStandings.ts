import { useCallback, useState, useEffect } from 'react';
import { TeamStanding, TableStanding } from '../types';
import generalService from '../../../services/generalService';
import { useChampionship } from '../../../features/championship/hooks/useChampionship';

export const useStandings = () => {
  const { state: championshipState, getTableStandings } = useChampionship();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get championship display name
  const getChampionshipName = useCallback(() => {
    if (!championshipState.selectedChampionship) return '';
    const allChamps = generalService.getAllChampionships();
    const foundChamp = allChamps.find(
      (c) => c.internalName === championshipState.selectedChampionship
    );
    return foundChamp ? foundChamp.name : championshipState.selectedChampionship;
  }, [championshipState.selectedChampionship]);

  // Convert table standings to the format needed by the component
  const convertToTeamStandings = useCallback((tableStandings: TableStanding[]): TeamStanding[] => {
    return tableStandings.length > 0
      ? tableStandings.map((s) => ({
          team: s.teamAbbreviation,
          w: s.wins,
          d: s.draws,
          l: s.losses,
          gd: s.goalDifference,
          pts: s.points,
        }))
      : Array.from({ length: 16 }, (_, i) => ({
          team: 'CEA',
          w: 4,
          d: 3,
          l: 1,
          gd: 10,
          pts: 10,
        }));
  }, []);

  // Load standings when championship state changes
  const loadStandings = useCallback(() => {
    try {
      setIsLoading(true);
      const tableStandings = getTableStandings();
      const newStandings = convertToTeamStandings(tableStandings);
      setStandings(newStandings);
      setError(null);
    } catch (err) {
      setError('Failed to load standings');
      console.error('Error loading standings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getTableStandings, convertToTeamStandings]);

  // Initial load
  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Check if the current season is complete
  const isSeasonComplete = useCallback(() => {
    const totalRounds = championshipState.seasonMatchCalendar.length;
    return championshipState.currentRound >= totalRounds;
  }, [championshipState.currentRound, championshipState.seasonMatchCalendar.length]);

  // Get paginated standings
  const getPaginatedStandings = useCallback(
    (page: number, itemsPerPage: number = 12) => {
      const startIndex = page * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return standings.slice(startIndex, endIndex);
    },
    [standings]
  );

  // Get total pages for pagination
  const getTotalPages = useCallback((itemsPerPage: number = 12) => {
    return Math.ceil(standings.length / itemsPerPage);
  }, [standings.length]);

  return {
    standings,
    currentPage,
    isLoading,
    error,
    championshipName: getChampionshipName(),
    isSeasonComplete: isSeasonComplete(),
    totalRounds: championshipState.seasonMatchCalendar.length,
    currentRound: championshipState.currentRound,
    year: championshipState.year,
    loadStandings,
    setCurrentPage: handlePageChange,
    getPaginatedStandings,
    getTotalPages,
  };
};

export default useStandings;
