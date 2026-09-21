/**
 * The save boundary: `GameState` in memory, `SavedGameState` in `localStorage`.
 *
 * Every `Match` and every `Standing` holds a full copy of its club, squad included, so a men's
 * saved game serialises to more than `localStorage`'s 5 MB quota. `dehydrate` writes those
 * references as ids and `hydrate` resolves them back against `championship.teams`, cutting a save
 * by ~92%. Nothing in the in-memory model changes.
 *
 * What is deliberately lost: a played match carries a *historical snapshot* of its clubs — morale,
 * and each player's xp / strength / isStarter / isSub as they stood that round — because
 * `TeamStatsService.updateChampionshipTeamStats` only refreshes fixtures in rounds that have not
 * started. After a reload every past match references the club as it is now. Nothing reads those
 * snapshots; the one that matters, the current round's lineup, is kept whole in
 * `currentRoundTeams`. See `wiki/decisions/ms-108-saved-game-size.md`.
 */
import { Championship } from '../../domain/models/Championship';
import ChampionshipContainer from '../../domain/models/ChampionshipContainer';
import Match from '../../domain/models/Match';
import Player from '../../domain/models/Player';
import Round from '../../domain/models/Round';
import Scorer from '../../domain/models/Scorer';
import Standing from '../../domain/models/Standing';
import { Team } from '../../domain/models/Team';
import { GameState } from '../../game-engine/GameState';
import {
  SAVE_VERSION,
  SavedChampionship,
  SavedGameState,
  SavedMatch,
  SavedRound,
  SavedScorer,
  SavedStanding,
} from '../data-transfer-objects/GameStateSaveDTO';

const dehydrateStanding = (standing: Standing): SavedStanding => {
  const { team, ...rest } = standing;
  return { ...rest, teamId: team.id };
};

const dehydrateScorer = (scorer: Scorer): SavedScorer => {
  const { player, ...rest } = scorer;
  return { ...rest, playerId: player.id };
};

const dehydrateMatch = (match: Match): SavedMatch => {
  const { homeTeam, awayTeam, scorers, ...rest } = match;
  return {
    ...rest,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    scorers: scorers.map(dehydrateScorer),
  };
};

const dehydrateRound = (round: Round): SavedRound => ({
  ...round,
  matches: round.matches.map(dehydrateMatch),
});

/**
 * `stamina` is match-scoped: it is recomputed from the minute on every tick, so a value caught
 * mid-match in a save is stale the instant it is read back. Dropped here rather than on load, so
 * it never reaches the disk at all.
 */
function withoutStamina(team: Team): Team {
  return {
    ...team,
    players: team.players.map(({ stamina: _stamina, ...player }) => player),
  };
}

/**
 * The clubs of the round about to be or being played, taken from the fixtures themselves rather
 * than from `teams`, so the lineup on screen survives the round-trip byte-identically.
 */
function currentRoundTeamsOf(championship: Championship): Team[] {
  const { currentRound, rounds } = championship.matchContainer;
  const byId = new Map<Team['id'], Team>();

  rounds
    .filter((round) => round.number === currentRound)
    .flatMap((round) => round.matches)
    .forEach((match) => {
      byId.set(match.homeTeam.id, match.homeTeam);
      byId.set(match.awayTeam.id, match.awayTeam);
    });

  return [...byId.values()].map(withoutStamina);
}

function dehydrateChampionship(championship: Championship): SavedChampionship {
  const {
    standings,
    matchContainer,
    phaseEntrants,
    firstPhaseStandings,
    phaseStandings,
    accumulatedStandings,
    ...rest
  } = championship;

  const saved = {
    ...rest,
    teams: rest.teams.map(withoutStamina),
    standings: standings.map(dehydrateStanding),
    matchContainer: { ...matchContainer, rounds: matchContainer.rounds.map(dehydrateRound) },
    currentRoundTeams: currentRoundTeamsOf(championship),
  } as SavedChampionship;

  if (phaseEntrants) {
    saved.phaseEntrants = phaseEntrants.map((entrants) => entrants.map((team) => team.id));
  }
  if (firstPhaseStandings) {
    saved.firstPhaseStandings = firstPhaseStandings.map(dehydrateStanding);
  }
  if (phaseStandings) {
    saved.phaseStandings = phaseStandings.map((table) => table.map(dehydrateStanding));
  }
  if (accumulatedStandings) {
    saved.accumulatedStandings = accumulatedStandings.map(dehydrateStanding);
  }

  return saved;
}

export function dehydrate(state: GameState): SavedGameState {
  const { championshipContainer, ...rest } = state;
  const { championships, playableInternalName, cups } = championshipContainer;

  return {
    ...rest,
    saveVersion: SAVE_VERSION,
    championshipContainer: {
      championships: championships.map(dehydrateChampionship),
      playableInternalName,
      ...(cups && { cups: cups.map(dehydrateChampionship) }),
    },
  };
}

/** Resolution tables for one saved championship. `currentRoundTeams` wins over `teams`. */
type Resolver = {
  team: (id: Team['id']) => Team;
  player: (id: Player['id']) => Player;
};

function resolverFor(saved: SavedChampionship): Resolver {
  const teams = new Map<Team['id'], Team>();
  const players = new Map<Player['id'], Player>();

  const register = (team: Team) => {
    teams.set(team.id, team);
    team.players.forEach((player) => players.set(player.id, player));
  };

  saved.teams.forEach(register);
  // Registered second so the current round's snapshot overrides the canonical club.
  saved.currentRoundTeams.forEach(register);

  return {
    team: (id) => {
      const team = teams.get(id);
      if (!team) throw new Error(`Saved game references unknown team ${id}.`);
      return team;
    },
    player: (id) => {
      const player = players.get(id);
      if (!player) throw new Error(`Saved game references unknown player ${id}.`);
      return player;
    },
  };
}

const hydrateStanding = (standing: SavedStanding, resolve: Resolver): Standing => {
  const { teamId, ...rest } = standing;
  return { ...rest, team: resolve.team(teamId) };
};

const hydrateScorer = (scorer: SavedScorer, resolve: Resolver): Scorer => {
  const { playerId, ...rest } = scorer;
  return { ...rest, player: resolve.player(playerId) };
};

const hydrateMatch = (match: SavedMatch, resolve: Resolver): Match => {
  const { homeTeamId, awayTeamId, scorers, ...rest } = match;
  return {
    ...rest,
    homeTeam: resolve.team(homeTeamId),
    awayTeam: resolve.team(awayTeamId),
    scorers: scorers.map((scorer) => hydrateScorer(scorer, resolve)),
  };
};

function hydrateChampionship(saved: SavedChampionship): Championship {
  const resolve = resolverFor(saved);
  const {
    standings,
    matchContainer,
    phaseEntrants,
    firstPhaseStandings,
    phaseStandings,
    accumulatedStandings,
    currentRoundTeams,
    ...rest
  } = saved;

  const championship = {
    ...rest,
    standings: standings.map((standing) => hydrateStanding(standing, resolve)),
    matchContainer: {
      ...matchContainer,
      rounds: matchContainer.rounds.map((round) => ({
        ...round,
        matches: round.matches.map((match) => hydrateMatch(match, resolve)),
      })),
    },
  } as Championship;

  if (phaseEntrants) {
    championship.phaseEntrants = phaseEntrants.map((entrants) => entrants.map(resolve.team));
  }
  if (firstPhaseStandings) {
    championship.firstPhaseStandings = firstPhaseStandings.map((standing) =>
      hydrateStanding(standing, resolve)
    );
  }
  if (phaseStandings) {
    championship.phaseStandings = phaseStandings.map((table) =>
      table.map((standing) => hydrateStanding(standing, resolve))
    );
  }
  if (accumulatedStandings) {
    championship.accumulatedStandings = accumulatedStandings.map((standing) =>
      hydrateStanding(standing, resolve)
    );
  }

  return championship;
}

export function hydrate(saved: SavedGameState): GameState {
  // `saveVersion` is dropped: it describes the payload, not the game.
  const { saveVersion: _version, championshipContainer, ...rest } = saved;
  const { championships, playableInternalName, cups } = championshipContainer;

  const container: ChampionshipContainer = {
    championships: championships.map(hydrateChampionship),
    playableInternalName,
    ...(cups && { cups: cups.map(hydrateChampionship) }),
  };

  return { ...rest, championshipContainer: container };
}

export default { dehydrate, hydrate };
