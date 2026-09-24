/**
 * The shape a game is persisted in.
 *
 * The in-memory `GameState` embeds a full copy of both squads in every `Match` and in every
 * `Standing`, which is 92% of a men's saved game and puts it over `localStorage`'s 5 MB quota
 * (`wiki/decisions/ms-108-saved-game-size.md`). These types describe the same state with every
 * team, player and standing reference replaced by an id; `championship.teams` is the resolution
 * source and is the only place a squad is written.
 *
 * Everything that does not hold a `Team`, a `Player` or a `Standing` is typed by reference to the
 * domain model, so this DTO tracks `GameState` instead of drifting from it.
 */
import { Championship } from '../../domain/models/Championship';
import Match from '../../domain/models/Match';
import MatchContainer from '../../domain/models/MatchContainer';
import Player from '../../domain/models/Player';
import Round from '../../domain/models/Round';
import Scorer from '../../domain/models/Scorer';
import Standing from '../../domain/models/Standing';
import { Team } from '../../domain/models/Team';
import { GameState } from '../../game-engine/GameState';

/**
 * The save format this module describes. A payload with any other version is not readable.
 *
 * 3 (MS-109): the container holds the whole pyramid plus a playable pointer instead of three named
 * slots. Version-2 saves are abandoned, not migrated, as MS-108 abandoned version 1.
 * 4 (MS-112): teams carry an optional `coach`, players carry `nationalities`, and Série D's
 * descriptor gains a playoff. Version-3 saves are abandoned, not migrated.
 */
export const SAVE_VERSION = 4;

/** A goal, with the scorer written as an id rather than a full `Player`. */
export type SavedScorer = Omit<Scorer, 'player'> & {
  playerId: Player['id'];
};

/** A fixture, with both clubs written as ids rather than full squads. */
export type SavedMatch = Omit<Match, 'homeTeam' | 'awayTeam' | 'scorers'> & {
  homeTeamId: Team['id'];
  awayTeamId: Team['id'];
  scorers: SavedScorer[];
};

/** A table row, with the club written as an id. */
export type SavedStanding = Omit<Standing, 'team'> & {
  teamId: Team['id'];
};

export type SavedRound = Omit<Round, 'matches'> & {
  matches: SavedMatch[];
};

export type SavedMatchContainer = Omit<MatchContainer, 'rounds'> & {
  rounds: SavedRound[];
};

/**
 * A championship with every team-bearing field dehydrated. `teams` stays whole — it is what the
 * ids resolve against.
 *
 * `currentRoundTeams` carries the clubs of the round about to be or being played in full, so the
 * lineup a player is looking at survives the round-trip byte-identically. One round is ~55,000 code
 * units, under 2% of a dehydrated save; every earlier round's historical snapshot is dropped (see
 * the equivalence rule in `wiki/decisions/ms-108-saved-game-size.md`).
 *
 * Distributed over the union so `isPromotable` / `isRelegatable` still narrow their dependent
 * fields, exactly as `Championship` does.
 */
export type SavedChampionship = Championship extends infer C
  ? C extends Championship
    ? Omit<
        C,
        | 'standings'
        | 'matchContainer'
        | 'phaseEntrants'
        | 'firstPhaseStandings'
        | 'phaseStandings'
        | 'accumulatedStandings'
      > & {
        standings: SavedStanding[];
        matchContainer: SavedMatchContainer;
        phaseEntrants?: Team['id'][][];
        firstPhaseStandings?: SavedStanding[];
        phaseStandings?: SavedStanding[][];
        accumulatedStandings?: SavedStanding[];
        currentRoundTeams: Team[];
      }
    : never
  : never;

/** Mirrors `ChampionshipContainer`: every division dehydrated, in tier order, and the pointer. */
export type SavedChampionshipContainer = {
  championships: SavedChampionship[];
  playableInternalName: string;
  cups?: SavedChampionship[];
};

export type SavedGameState = Omit<GameState, 'championshipContainer'> & {
  saveVersion: typeof SAVE_VERSION;
  championshipContainer: SavedChampionshipContainer;
};
