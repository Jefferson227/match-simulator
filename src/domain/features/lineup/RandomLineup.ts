import { FORMATIONS } from '../../enums/Formations';
import Player from '../../models/Player';
import { Team } from '../../models/Team';
import { RandomProvider } from '../match-simulation/types';

const FORMATION_REQUIREMENTS = FORMATIONS.map((formation) => {
  const [defenders, midfielders, forwards] = formation.split('-').map(Number);
  return { formation, defenders, midfielders, forwards };
});

const BENCH_SIZE = 6;

function pickRandomPlayers(players: Player[], count: number, rng: RandomProvider): Player[] {
  if (count <= 0 || players.length === 0) return [];

  const pickedCount = Math.min(count, players.length);
  const cloned = players.slice();

  for (let i = 0; i < pickedCount; i++) {
    const randomIndex = i + rng.nextInt(0, cloned.length - i - 1);
    const temp = cloned[i];
    cloned[i] = cloned[randomIndex];
    cloned[randomIndex] = temp;
  }

  return cloned.slice(0, pickedCount);
}

/**
 * An AI club's starting 11 and bench for one match: a random formation the squad can field, random
 * players for each line of it, and up to six substitutes from the rest. A squad that fits no
 * formation fields a goalkeeper and ten outfield players instead.
 *
 * Used before every AI match, whether it is played minute by minute alongside the human's or in one
 * pass by an AI division catching up.
 */
export function pickRandomLineup(team: Team, rng: RandomProvider): Team {
  const goalkeepers: Player[] = [];
  const defenders: Player[] = [];
  const midfielders: Player[] = [];
  const forwards: Player[] = [];

  for (let i = 0; i < team.players.length; i++) {
    const player = team.players[i];
    if (player.position === 'GK') {
      goalkeepers.push(player);
    } else if (player.position === 'DF') {
      defenders.push(player);
    } else if (player.position === 'MF') {
      midfielders.push(player);
    } else if (player.position === 'FW') {
      forwards.push(player);
    }
  }

  const availableFormations = FORMATION_REQUIREMENTS.filter(
    (formation) =>
      goalkeepers.length >= 1 &&
      defenders.length >= formation.defenders &&
      midfielders.length >= formation.midfielders &&
      forwards.length >= formation.forwards
  );

  const starterIds = new Set<string>();
  if (availableFormations.length > 0) {
    const selectedFormation = availableFormations[rng.nextInt(0, availableFormations.length - 1)];

    pickRandomPlayers(goalkeepers, 1, rng).forEach((player) => starterIds.add(player.id));
    pickRandomPlayers(defenders, selectedFormation.defenders, rng).forEach((player) =>
      starterIds.add(player.id)
    );
    pickRandomPlayers(midfielders, selectedFormation.midfielders, rng).forEach((player) =>
      starterIds.add(player.id)
    );
    pickRandomPlayers(forwards, selectedFormation.forwards, rng).forEach((player) =>
      starterIds.add(player.id)
    );
  } else {
    const gkStarter = pickRandomPlayers(goalkeepers, 1, rng);
    const gkStarterIds = new Set(gkStarter.map((player) => player.id));

    const availableOutfieldPlayers = team.players.filter(
      (player) => player.position !== 'GK' && !gkStarterIds.has(player.id)
    );
    const outfieldStarters = pickRandomPlayers(availableOutfieldPlayers, 10, rng);

    gkStarter.forEach((player) => starterIds.add(player.id));
    outfieldStarters.forEach((player) => starterIds.add(player.id));
  }

  if (starterIds.size === 0) {
    const fallbackStarters = pickRandomPlayers(team.players, 11, rng);
    fallbackStarters.forEach((player) => starterIds.add(player.id));
  }

  const availableSubs = team.players.filter((player) => !starterIds.has(player.id));
  const subs = pickRandomPlayers(availableSubs, BENCH_SIZE, rng);
  const subIds = new Set(subs.map((player) => player.id));

  return {
    ...team,
    players: team.players.map((player) => ({
      ...player,
      isStarter: starterIds.has(player.id),
      isSub: subIds.has(player.id),
    })),
  };
}
