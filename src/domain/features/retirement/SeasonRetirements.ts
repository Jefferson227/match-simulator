import ChampionshipContainer from '../../models/ChampionshipContainer';
import PlayerPosition from '../../enums/PlayerPosition';
import RetiredCoach from '../../models/RetiredCoach';
import RetiredPlayer from '../../models/RetiredPlayer';

/** One division's retirements in a season. */
export type DivisionRetirements = {
  internalName: string;
  divisionName: string;
  players: RetiredPlayer[];
  coaches: RetiredCoach[];
};

/** Everyone who retired in one season, for the league-wide pages of the Retirements screen. */
export type SeasonRetirements = {
  season: number;
  /** Every division of the pyramid, top tier first — including those where nobody retired. */
  divisions: DivisionRetirements[];
  /** Coaches who retired out of the coach pool; they had no club. */
  poolCoaches: RetiredCoach[];
  /** Retirees whose division was not recorded (retired by an early MS-113 build) or is unknown. */
  unplaced: { players: RetiredPlayer[]; coaches: RetiredCoach[] };
};

const POSITION_ORDER: Record<PlayerPosition, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };

const byClubThenPosition = (a: RetiredPlayer, b: RetiredPlayer): number =>
  a.lastTeamShortName.localeCompare(b.lastTeamShortName) ||
  POSITION_ORDER[a.position] - POSITION_ORDER[b.position] ||
  a.name.localeCompare(b.name);

const byClub = (a: RetiredCoach, b: RetiredCoach): number =>
  (a.lastTeamShortName ?? '').localeCompare(b.lastTeamShortName ?? '') ||
  a.name.localeCompare(b.name);

/**
 * `season`'s retirees grouped by the division their club played that season in, in the
 * container's tier order. Each division lists its players by club, then position; its coaches by
 * club.
 */
export function buildSeasonRetirements(
  container: ChampionshipContainer,
  retiredPlayers: RetiredPlayer[],
  retiredCoaches: RetiredCoach[],
  season: number
): SeasonRetirements {
  const divisions: DivisionRetirements[] = (container.championships ?? []).map((championship) => ({
    internalName: championship.internalName,
    divisionName: championship.name,
    players: [],
    coaches: [],
  }));
  const divisionOf = new Map(divisions.map((division) => [division.internalName, division]));
  const unplaced: SeasonRetirements['unplaced'] = { players: [], coaches: [] };
  const poolCoaches: RetiredCoach[] = [];

  for (const player of retiredPlayers) {
    if (player.retiredInSeason !== season) continue;
    const division = divisionOf.get(player.lastChampionshipInternalName ?? '');
    (division?.players ?? unplaced.players).push(player);
  }

  for (const coach of retiredCoaches) {
    if (coach.retiredInSeason !== season) continue;
    if (!coach.lastTeamId) {
      poolCoaches.push(coach);
      continue;
    }
    const division = divisionOf.get(coach.lastChampionshipInternalName ?? '');
    (division?.coaches ?? unplaced.coaches).push(coach);
  }

  for (const division of divisions) {
    division.players.sort(byClubThenPosition);
    division.coaches.sort(byClub);
  }
  unplaced.players.sort(byClubThenPosition);
  unplaced.coaches.sort(byClub);
  poolCoaches.sort((a, b) => a.name.localeCompare(b.name));

  return { season, divisions, poolCoaches, unplaced };
}
