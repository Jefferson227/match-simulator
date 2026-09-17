import { describe, expect, it } from '@jest/globals';
import {
  getChampionshipByInternalName,
  getDivisionAbove,
  getDivisionBelow,
  getPlayableChampionship,
  replaceChampionship,
  updatePlayableChampionship,
} from '../../../../src/domain/features/pyramid/Pyramid';
import { Championship } from '../../../../src/domain/models/Championship';
import ChampionshipContainer from '../../../../src/domain/models/ChampionshipContainer';

/** A bare division of a three-tier chain: top → middle → bottom. */
function division(internalName: string, above?: string, below?: string): Championship {
  return {
    id: internalName,
    name: internalName.toUpperCase(),
    internalName,
    numberOfTeams: 0,
    teams: [],
    standings: [],
    matchContainer: { timer: 0, currentSeason: 2026, currentRound: 1, totalRounds: 0, rounds: [] },
    type: 'double-round-robin',
    leagueType: 'mens',
    hasTeamControlledByHuman: false,
    ...(above
      ? { isPromotable: true, numberOfPromotableTeams: 4, promotionChampionshipInternalName: above }
      : { isPromotable: false }),
    ...(below
      ? {
          isRelegatable: true,
          numberOfRelegatableTeams: 4,
          relegationChampionshipInternalName: below,
        }
      : { isRelegatable: false }),
  } as Championship;
}

const top = division('top', undefined, 'middle');
const middle = division('middle', 'top', 'bottom');
const bottom = division('bottom', 'middle');

const container: ChampionshipContainer = {
  championships: [top, middle, bottom],
  playableInternalName: 'bottom',
};

describe('Pyramid', () => {
  it('finds a division by internal name, and nothing for an unknown one', () => {
    expect(getChampionshipByInternalName(container, 'middle')).toBe(middle);
    expect(getChampionshipByInternalName(container, 'nowhere')).toBeUndefined();
  });

  it('reads the playable division off the pointer', () => {
    expect(getPlayableChampionship(container)).toBe(bottom);
    expect(getPlayableChampionship({ ...container, playableInternalName: 'top' })).toBe(top);
  });

  it('throws when the pointer names no division', () => {
    expect(() => getPlayableChampionship({ championships: [], playableInternalName: '' })).toThrow(
      'Playable championship not found.'
    );
  });

  it('walks up and down the chain', () => {
    expect(getDivisionAbove(container, bottom)).toBe(middle);
    expect(getDivisionAbove(container, middle)).toBe(top);
    expect(getDivisionBelow(container, top)).toBe(middle);
    expect(getDivisionBelow(container, middle)).toBe(bottom);
  });

  it('has no division above the top tier and none below the bottom tier', () => {
    expect(getDivisionAbove(container, top)).toBeUndefined();
    expect(getDivisionBelow(container, bottom)).toBeUndefined();
  });

  it('replaces a division by internal name without touching the original container', () => {
    const renamed = { ...middle, name: 'RENAMED' };
    const updated = replaceChampionship(container, renamed);

    expect(updated.championships).toEqual([top, renamed, bottom]);
    expect(updated.championships[0]).toBe(top);
    expect(updated.playableInternalName).toBe('bottom');
    expect(container.championships[1]).toBe(middle);
  });

  it('keeps the cups when replacing a division', () => {
    const withCups = { ...container, cups: [division('cup')] };
    expect(replaceChampionship(withCups, middle).cups).toBe(withCups.cups);
  });

  it('refuses to replace a division the pyramid does not hold', () => {
    expect(() => replaceChampionship(container, division('nowhere'))).toThrow(
      'Championship nowhere not found.'
    );
  });

  it('updates the playable division in place', () => {
    const updated = updatePlayableChampionship(container, (playable) => ({
      ...playable,
      name: 'PLAYED',
    }));

    expect(updated.championships.map((championship) => championship.name)).toEqual([
      'TOP',
      'MIDDLE',
      'PLAYED',
    ]);
  });
});
