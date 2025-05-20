import utils from '../utils/utils';
import { MatchState, Team, Player, Match } from '../types';
import { MatchAction } from '../contexts/MatchContext';

const { addPlayerAttributes, getRandomNumber, getAverage, getSum } = utils;

export const matchReducer = (
  state: MatchState,
  action: MatchAction
): MatchState => {
  switch (action.type) {
    case 'SET_MATCHES': {
      const { homeTeam, visitorTeam } = action.payload;

      return {
        ...state,
        matches: [
          ...state.matches,
          {
            id: crypto.randomUUID(),
            homeTeam: {
              ...homeTeam,
              players: addPlayerAttributes(homeTeam.players),
              substitutes: addPlayerAttributes(homeTeam.substitutes),
              isHomeTeam: true,
              score: 0,
              morale: getRandomNumber(0, 100),
              overallMood: getAverage(homeTeam.players.map((p) => p.mood)),
              overallStrength: getSum(homeTeam.players.map((p) => p.strength)),
              attackStrength: getSum(
                homeTeam.players
                  .filter((p) => p.position === 'FW')
                  .map((p) => p.strength)
              ),
              midfieldStrength: getSum(
                homeTeam.players
                  .filter((p) => p.position === 'MF')
                  .map((p) => p.strength)
              ),
              defenseStrength: getSum(
                homeTeam.players
                  .filter((p) => p.position === 'DF' || p.position === 'GK')
                  .map((p) => p.strength)
              ),
            },
            visitorTeam: {
              ...visitorTeam,
              players: addPlayerAttributes(visitorTeam.players),
              substitutes: addPlayerAttributes(visitorTeam.substitutes),
              isHomeTeam: false,
              score: 0,
              morale: getRandomNumber(0, 100),
              overallMood: getAverage(visitorTeam.players.map((p) => p.mood)),
              overallStrength: getSum(
                visitorTeam.players.map((p) => p.strength)
              ),
              attackStrength: getSum(
                visitorTeam.players
                  .filter((p) => p.position === 'FW')
                  .map((p) => p.strength)
              ),
              midfieldStrength: getSum(
                visitorTeam.players
                  .filter((p) => p.position === 'MF')
                  .map((p) => p.strength)
              ),
              defenseStrength: getSum(
                visitorTeam.players
                  .filter((p) => p.position === 'DF' || p.position === 'GK')
                  .map((p) => p.strength)
              ),
            },
            lastScorer: null,
          },
        ],
      };
    }
    case 'SET_SCORER': {
      const { matchId, scorer } = action.payload;

      return {
        ...state,
        matches: state.matches.map((m) => {
          return m.id === matchId
            ? {
                ...m,
                lastScorer: {
                  playerName: scorer.playerName,
                  time: scorer.time,
                },
              }
            : m;
        }),
      };
    }
    case 'INCREASE_SCORE': {
      const { matchId, scorerTeam } = action.payload;

      return {
        ...state,
        matches: state.matches.map((m) => {
          if (m.id === matchId) {
            // Create a new copy of the match
            const updatedMatch = { ...m };

            // Find the team (either homeTeam or visitorTeam)
            if (scorerTeam.isHomeTeam) {
              updatedMatch.homeTeam = {
                ...updatedMatch.homeTeam,
                score: (updatedMatch.homeTeam.score || 0) + 1,
              };
            } else {
              updatedMatch.visitorTeam = {
                ...updatedMatch.visitorTeam,
                score: (updatedMatch.visitorTeam.score || 0) + 1,
              };
            }

            return updatedMatch;
          }

          return m;
        }),
      };
    }
    case 'SET_TEAM_SQUAD_VIEW': {
      const { teamSquadView } = action.payload;

      return {
        ...state,
        teamSquadView,
      };
    }
    case 'CONFIRM_SUBSTITUTION': {
      const { matchId, team, selectedPlayer, selectedSubstitute } =
        action.payload;

      return {
        ...state,
        matches: state.matches.map((match) => {
          if (match.id === matchId) {
            // Create a new copy of the match
            const updatedMatch = { ...match };

            // Find and update the correct team
            if (team.isHomeTeam) {
              // Create copies of players and substitutes arrays
              const filteredPlayers = updatedMatch.homeTeam.players.filter(
                (p) => p.id !== selectedPlayer.id
              );

              const sortedPlayers = [
                ...filteredPlayers,
                selectedSubstitute,
              ].sort((a, b) => {
                if ((a.order ?? 0) < (b.order ?? 0)) {
                  return -1; // a comes before b
                }
                if ((a.order ?? 0) > (b.order ?? 0)) {
                  return 1; // a comes after b
                }
                return 0; // a and b are equal
              });

              const filteredSubstitutes =
                updatedMatch.homeTeam.substitutes.filter(
                  (s) => s.id !== selectedSubstitute.id
                );

              // Update the homeTeam
              updatedMatch.homeTeam = {
                ...updatedMatch.homeTeam,
                players: sortedPlayers,
                substitutes: filteredSubstitutes,
              };
            } else {
              // Create copies of players and substitutes arrays
              const filteredPlayers = updatedMatch.visitorTeam.players.filter(
                (p) => p.id !== selectedPlayer.id
              );

              const sortedPlayers = [
                ...filteredPlayers,
                selectedSubstitute,
              ].sort((a, b) => {
                if ((a.order ?? 0) < (b.order ?? 0)) {
                  return -1; // a comes before b
                }
                if ((a.order ?? 0) > (b.order ?? 0)) {
                  return 1; // a comes after b
                }
                return 0; // a and b are equal
              });

              const filteredSubstitutes =
                updatedMatch.visitorTeam.substitutes.filter(
                  (s) => s.id !== selectedSubstitute.id
                );

              // Update the visitorTeam
              updatedMatch.visitorTeam = {
                ...updatedMatch.visitorTeam,
                players: sortedPlayers,
                substitutes: filteredSubstitutes,
              };
            }

            return updatedMatch;
          }

          return match;
        }),
      };
    }
    default:
      return state;
  }
};
