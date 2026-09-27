import { describe, expect, it } from '@jest/globals';
import { buildSeasonRetirements } from '../../../../src/domain/features/retirement/SeasonRetirements';
import ChampionshipContainer from '../../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../../src/domain/models/Championship';
import RetiredPlayer from '../../../../src/domain/models/RetiredPlayer';
import RetiredCoach from '../../../../src/domain/models/RetiredCoach';
import Player from '../../../../src/domain/models/Player';

const container = {
  championships: [
    { internalName: 'top', name: 'Top Division' },
    { internalName: 'bottom', name: 'Bottom Division' },
  ] as Championship[],
  playableInternalName: 'bottom',
} as ChampionshipContainer;

function retiredPlayer(
  name: string,
  club: string,
  position: Player['position'],
  division: string | undefined,
  season = 2026
): RetiredPlayer {
  return {
    id: `${name}-a-b-c-d`,
    position,
    name,
    strength: 50,
    age: 36,
    nationalities: ['BRA'],
    xp: 0,
    isRetired: true,
    retiredInSeason: season,
    lastTeamId: `${club}-t-e-a-m`,
    lastTeamShortName: club,
    ...(division && { lastChampionshipInternalName: division }),
  };
}

function retiredCoach(name: string, club?: string, division?: string, season = 2026): RetiredCoach {
  return {
    name,
    age: 70,
    isRetired: true,
    retiredInSeason: season,
    ...(club && { lastTeamId: `${club}-t-e-a-m`, lastTeamShortName: club }),
    ...(division && { lastChampionshipInternalName: division }),
  };
}

describe('buildSeasonRetirements', () => {
  it('lists every division in tier order, even those where nobody retired', () => {
    const view = buildSeasonRetirements(container, [], [], 2026);
    expect(view.divisions.map((d) => [d.internalName, d.divisionName, d.players.length])).toEqual([
      ['top', 'Top Division', 0],
      ['bottom', 'Bottom Division', 0],
    ]);
  });

  it('groups players by the division they retired in, by club then position', () => {
    const view = buildSeasonRetirements(
      container,
      [
        retiredPlayer('Zeca', 'Beta', 'FW', 'top'),
        retiredPlayer('Ana', 'Beta', 'GK', 'top'),
        retiredPlayer('Bia', 'Alfa', 'MF', 'top'),
        retiredPlayer('Caio', 'Gama', 'DF', 'bottom'),
      ],
      [],
      2026
    );

    expect(view.divisions[0].players.map((p) => p.name)).toEqual(['Bia', 'Ana', 'Zeca']);
    expect(view.divisions[1].players.map((p) => p.name)).toEqual(['Caio']);
  });

  it('keeps only the requested season', () => {
    const view = buildSeasonRetirements(
      container,
      [retiredPlayer('Old', 'Alfa', 'GK', 'top', 2025), retiredPlayer('New', 'Alfa', 'GK', 'top')],
      [retiredCoach('Old Coach', 'Alfa', 'top', 2025)],
      2026
    );

    expect(view.divisions[0].players.map((p) => p.name)).toEqual(['New']);
    expect(view.divisions[0].coaches).toEqual([]);
  });

  it('puts club coaches under their division and pool coaches in their own group', () => {
    const view = buildSeasonRetirements(
      container,
      [],
      [retiredCoach('Club Coach', 'Alfa', 'bottom'), retiredCoach('Pool Coach')],
      2026
    );

    expect(view.divisions[1].coaches.map((c) => c.name)).toEqual(['Club Coach']);
    expect(view.poolCoaches.map((c) => c.name)).toEqual(['Pool Coach']);
  });

  it('sets aside retirees whose division was not recorded or is unknown', () => {
    const view = buildSeasonRetirements(
      container,
      [
        retiredPlayer('Early', 'Alfa', 'GK', undefined),
        retiredPlayer('Lost', 'Alfa', 'GK', 'gone'),
      ],
      [retiredCoach('Early Coach', 'Alfa')],
      2026
    );

    expect(view.unplaced.players.map((p) => p.name)).toEqual(['Early', 'Lost']);
    expect(view.unplaced.coaches.map((c) => c.name)).toEqual(['Early Coach']);
    expect(view.divisions.every((d) => d.players.length === 0)).toBe(true);
  });

  it('places every retiree exactly once', () => {
    const players = [
      retiredPlayer('A', 'Alfa', 'GK', 'top'),
      retiredPlayer('B', 'Beta', 'DF', 'bottom'),
      retiredPlayer('C', 'Beta', 'DF', undefined),
    ];
    const coaches = [
      retiredCoach('X', 'Alfa', 'top'),
      retiredCoach('Y'),
      retiredCoach('Z', 'Beta'),
    ];
    const view = buildSeasonRetirements(container, players, coaches, 2026);

    const placedPlayers = [...view.divisions.flatMap((d) => d.players), ...view.unplaced.players];
    const placedCoaches = [
      ...view.divisions.flatMap((d) => d.coaches),
      ...view.poolCoaches,
      ...view.unplaced.coaches,
    ];
    expect(placedPlayers.map((p) => p.name).sort()).toEqual(['A', 'B', 'C']);
    expect(placedCoaches.map((c) => c.name).sort()).toEqual(['X', 'Y', 'Z']);
  });
});
