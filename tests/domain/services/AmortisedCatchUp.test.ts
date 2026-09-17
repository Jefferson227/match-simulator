/**
 * MS-109: the AI divisions are dripped across the season, one pace step per playable round, instead
 * of being caught up in one pass at the playable division's phase boundaries (MS-103). The season-end
 * catch-up stays, as the guarantee that the roll-over never reads an unfinished table.
 *
 * Pace: after the playable division completes `p` of its `P` rounds, an AI division of `N` rounds has
 * completed `ceil(p × N / P)`.
 */
import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { getSeasonRoundCount } from '../../../src/domain/features/phases/SeasonRoundCount';
import {
  getChampionshipByInternalName,
  getPlayableChampionship,
} from '../../../src/domain/features/pyramid/Pyramid';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';

beforeAll(useUniqueTeamIds);

const completed = (championship: Championship) =>
  championship.matchContainer.rounds.filter((round) => round.status === 'ended').length;

const hasRoundToPlay = (championship: Championship) => {
  const { currentRound, rounds } = championship.matchContainer;
  return rounds.some((round) => round.number === currentRound);
};

const aiDivisions = (container: ChampionshipContainer) =>
  container.championships.filter(
    (championship) => championship.internalName !== container.playableInternalName
  );

const tableOf = (championship: Championship) => ({
  standings: championship.standings.map((standing) => [
    standing.team.id,
    standing.points,
    standing.goalsFor,
    standing.goalsAgainst,
  ]),
  phaseStandings: championship.phaseStandings,
  survivingTeamIds: championship.survivingTeamIds,
  phaseParticipants: championship.phaseParticipants,
});

/** Every state a scripted season passes through, from kick-off to its last round. */
function playRecording(entry: string): { season: ScriptedSeason; states: ChampionshipContainer[] } {
  const season = new ScriptedSeason(entry);
  const states = [season.container];
  for (let guard = 0; guard < 100 && hasRoundToPlay(season.championship); guard++) {
    season.playRound();
    states.push(season.container);
  }
  return { season, states };
}

describe.each([
  ["men's, human in Série D", 'brasileirao-serie-d'],
  ["men's, human in Série A", 'brasileirao-serie-a'],
  ["women's, human in A3", 'brasileirao-feminino-serie-a3'],
])('%s', (_, entry) => {
  let states: ChampionshipContainer[];
  let seasonEndIndex: number;

  beforeAll(() => {
    ({ states } = playRecording(entry));
    // The first state in which every AI division has finished: the playable season-end catch-up.
    seasonEndIndex = states.findIndex((state) =>
      aiDivisions(state).every((division) => !hasRoundToPlay(division))
    );
  });

  it('reaches a season end at which every AI division is finished', () => {
    expect(seasonEndIndex).toBeGreaterThan(0);
    aiDivisions(states[states.length - 1]).forEach((division) =>
      expect(hasRoundToPlay(division)).toBe(false)
    );
  });

  it('keeps every AI division exactly on pace after every playable round before the season end', () => {
    for (let index = 1; index < seasonEndIndex; index++) {
      const playable = getPlayableChampionship(states[index]);
      const playableSeason = getSeasonRoundCount(playable);

      for (const division of aiDivisions(states[index])) {
        const season = getSeasonRoundCount(division);
        const target = Math.ceil((completed(playable) * season) / playableSeason);
        expect({
          division: division.internalName,
          round: index,
          completed: completed(division),
        }).toEqual({ division: division.internalName, round: index, completed: target });
      }
    }
  });

  it('never catches a division up to its end at a playable phase boundary', () => {
    for (let index = 1; index < seasonEndIndex; index++) {
      const previous = getPlayableChampionship(states[index - 1]);
      const current = getPlayableChampionship(states[index]);
      if ((previous.currentPhaseIndex ?? 0) === (current.currentPhaseIndex ?? 0)) continue;

      const unfinished = aiDivisions(states[index]).filter(hasRoundToPlay);
      expect(unfinished.length).toBeGreaterThan(0);
    }
  });

  it('plays each AI division to the same result as one pass at the season end', () => {
    // Replay the round that ended the season with every AI division put back to its kick-off
    // state: the season-end catch-up then plays each of them in one pass, from a fresh stream.
    const kickOff = states[0];
    const beforeSeasonEnd = states[seasonEndIndex - 1];
    const onePass = new ScriptedSeason(entry);
    onePass.container = {
      ...beforeSeasonEnd,
      championships: beforeSeasonEnd.championships.map((championship) =>
        championship.internalName === beforeSeasonEnd.playableInternalName
          ? championship
          : getChampionshipByInternalName(kickOff, championship.internalName)!
      ),
    };
    onePass.playRound();

    for (const dripped of aiDivisions(states[seasonEndIndex])) {
      const inOnePass = getChampionshipByInternalName(onePass.container, dripped.internalName)!;
      expect(completed(inOnePass)).toBe(completed(dripped));
      expect(tableOf(inOnePass)).toEqual(tableOf(dripped));
    }
  });
});
