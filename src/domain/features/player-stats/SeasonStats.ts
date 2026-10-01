import Match from '../../models/Match';
import Player from '../../models/Player';
import { Team } from '../../models/Team';

/**
 * Who took part in a match, read off the club's match copy after the final whistle: every player
 * still on the pitch, every substitute who came on, and every player who was substituted off.
 * Unused substitutes did not play.
 */
export function playersWhoAppeared(team: Team): Player[] {
  return team.players.filter(
    (player) =>
      player.isStarter || player.enteredAtMinute !== undefined || player.leftAtMinute !== undefined
  );
}

/**
 * Goals per player id, from `match.scorers` only. Penalty-shootout kicks live in
 * `match.penaltyShootout` and are not goals.
 */
export function goalsByPlayer(match: Match): Map<Player['id'], number> {
  const goals = new Map<Player['id'], number>();
  match.scorers.forEach((scorer) => {
    goals.set(scorer.player.id, (goals.get(scorer.player.id) ?? 0) + 1);
  });
  return goals;
}

/**
 * `teams` with each player's season counters raised by `matches`: one game per match they appeared
 * in, and every goal they scored. A club's match copy decides who appeared; the counters are written
 * to the clubs in `teams`, so nothing else from the match copy is carried over. Clubs in none of
 * `matches` come back as they were.
 */
export function applyMatchStats(teams: Team[], matches: Match[]): Team[] {
  const games = new Map<Player['id'], number>();
  const goals = new Map<Player['id'], number>();

  matches.forEach((match) => {
    [match.homeTeam, match.awayTeam].forEach((team) =>
      playersWhoAppeared(team).forEach((player) =>
        games.set(player.id, (games.get(player.id) ?? 0) + 1)
      )
    );
    goalsByPlayer(match).forEach((count, playerId) =>
      goals.set(playerId, (goals.get(playerId) ?? 0) + count)
    );
  });

  return teams.map((team) => {
    if (!team.players.some((player) => games.has(player.id) || goals.has(player.id))) return team;

    return {
      ...team,
      players: team.players.map((player) =>
        games.has(player.id) || goals.has(player.id)
          ? {
              ...player,
              seasonGames: player.seasonGames + (games.get(player.id) ?? 0),
              seasonGoals: player.seasonGoals + (goals.get(player.id) ?? 0),
            }
          : player
      ),
    };
  });
}
