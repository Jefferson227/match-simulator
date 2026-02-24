import { Championship } from '../core/models/Championship';
import Match from '../core/models/Match';
import Player from '../core/models/Player';
import { Team } from '../core/models/Team';
import TeamService from '../core/services/TeamService';
import { GameState } from '../game-engine/GameState';

export default class TeamUseCases {
  private state = {} as GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  private getMatchesFromCurrentRound(state: GameState): Match[] {
    const currentRound =
      state.championshipContainer.playableChampionship.matchContainer.currentRound;
    const round = state.championshipContainer.playableChampionship.matchContainer.rounds.find(
      (round) => round.number === currentRound
    );

    if (!round) return [];

    return round.matches;
  }

  selectTeam(teamId: string): GameState {
    const selectTeamResult = TeamService.selectTeam(
      this.state.championshipContainer.playableChampionship,
      teamId
    );

    if (!selectTeamResult.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: selectTeamResult.error.message,
      };
    }

    return {
      ...this.state,
      championshipContainer: {
        ...this.state.championshipContainer,
        playableChampionship: selectTeamResult.getResult(),
      },
    };
  }

  setStartersAndSubs(teamId: string, starters: Player[], subs: Player[]): GameState {
    const teams = this.state.championshipContainer.playableChampionship.teams;
    const result = TeamService.setStartersAndSubs(teamId, starters, subs, teams);

    if (!result.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: result.error.message,
      };
    }

    return {
      ...this.state,
      championshipContainer: {
        ...this.state.championshipContainer,
        playableChampionship: {
          ...this.state.championshipContainer.playableChampionship,
          teams: this.state.championshipContainer.playableChampionship.teams.map((team) =>
            team.id === result.getResult().id ? result.getResult() : team
          ),
        },
      },
    };
  }

  substitutePlayer(matchId: string, teamId: string, playerId: string, subId: string): GameState {
    const matches = this.getMatchesFromCurrentRound(this.state);
    if (!matches) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: 'Match could not be found to confirm substitution.',
      };
    }

    const match = matches.find((match) => match.id === matchId);
    if (!match) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: 'Match could not be found to confirm substitution.',
      };
    }

    let teamToUpdate: Team | undefined;
    if (match.homeTeam.id === teamId) teamToUpdate = match.homeTeam;
    if (match.awayTeam.id === teamId) teamToUpdate = match.awayTeam;

    if (!teamToUpdate) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: 'Team could not be found to confirm substitution.',
      };
    }

    const updatedTeamForSubstitution = {
      ...teamToUpdate,
      players: teamToUpdate.players.map((player) => {
        if (player.id === playerId) {
          return { ...player, isStarter: false, isSub: false };
        }

        if (player.id === subId) {
          return { ...player, isStarter: true, isSub: false };
        }

        return player;
      }),
    };

    const updatedMatch =
      match.homeTeam.id === updatedTeamForSubstitution.id
        ? { ...match, homeTeam: updatedTeamForSubstitution }
        : { ...match, awayTeam: updatedTeamForSubstitution };

    const playableChampionship = this.state.championshipContainer.playableChampionship;
    const matchContainer = playableChampionship.matchContainer;

    let roundIndex = -1;
    for (let i = 0; i < matchContainer.rounds.length; i++) {
      if (matchContainer.rounds[i].number === matchContainer.currentRound) {
        roundIndex = i;
        break;
      }
    }

    if (roundIndex === -1) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: 'Round could not be found to confirm substitution.',
      };
    }

    const round = matchContainer.rounds[roundIndex];
    const matchIndex = round.matches.findIndex((currentMatch) => currentMatch.id === matchId);
    if (matchIndex === -1) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: 'Match could not be found to confirm substitution.',
      };
    }

    const updatedMatches = round.matches.slice();
    updatedMatches[matchIndex] = updatedMatch;

    const updatedRounds = matchContainer.rounds.slice();
    updatedRounds[roundIndex] = {
      ...round,
      matches: updatedMatches,
    };

    return {
      ...this.state,
      championshipContainer: {
        ...this.state.championshipContainer,
        playableChampionship: {
          ...playableChampionship,
          matchContainer: {
            ...matchContainer,
            rounds: updatedRounds,
          },
        },
      },
    };
  }

  getTeamsToSelect(championship: Championship): Team[] {
    const result = TeamService.getTeamsToSelect(championship);
    if (!result.succeeded) {
      throw new Error('List of teams could not be found from championship.');
    }

    return result.getResult();
  }
}
