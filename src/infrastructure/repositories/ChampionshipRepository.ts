import ChampionshipJSONDTO from '../data-transfer-objects/ChampionshipJSONDTO';
import championshipsJSON from '../data/championships.json';
import { Championship } from '../../domain/models/Championship';
import ChampionshipPhase, { PhaseVariant } from '../../domain/models/ChampionshipPhase';
import LeagueType from '../../domain/enums/LeagueType';
import TeamRepository from './TeamRepository';

/**
 * Rejects every variant list the rest of the system cannot honour.
 *
 * Thrown as a plain `Error`, the repository's convention — the services turn these into
 * `OperationResult` errors. A variant list is seed data, so every one of these is a data bug that
 * should stop the game loading rather than surface as a malformed season.
 */
function validatePhaseVariants(championship: ChampionshipJSONDTO): void {
  const variants = championship.phaseVariants;
  if (!variants?.length) return;

  const name = championship.internalName;

  const sortedDescending = variants.every(
    (variant, index) =>
      index === 0 || variants[index - 1].minNumberOfTeams > variant.minNumberOfTeams
  );
  if (!sortedDescending) {
    throw new Error(
      `Phase variants of ${name} must be sorted descending by minNumberOfTeams; they are matched in declared order.`
    );
  }

  const fieldSize = championship.teamNames.length;
  const matching = variants.find((variant) => variant.minNumberOfTeams <= fieldSize);
  if (!matching) {
    throw new Error(
      `No phase variant of ${name} can be played with its seeded field of ${fieldSize} clubs.`
    );
  }

  // Staggered entry and variants are not combined: `phaseEntrants` is resolved once from `phases`
  // and would go stale the moment a roll-over swapped the shape underneath it.
  if (
    variants.some((variant) =>
      variant.phases.some((phase) => phase.kind === 'knockout' && phase.entrants?.length)
    )
  ) {
    throw new Error(
      `Phase variants of ${name} must not declare entrants; staggered entry cannot survive a shape change.`
    );
  }

  // A fresh load and a roll-over into the same size have to agree, so the shape in force must be
  // the one the seeded club count selects.
  const inForce = variants.find(
    (variant) => variant.minNumberOfTeams <= championship.numberOfTeams
  ) as PhaseVariant | undefined;
  if (JSON.stringify(championship.phases) !== JSON.stringify(inForce?.phases)) {
    throw new Error(
      `Phases of ${name} must equal the variant matching its numberOfTeams (${championship.numberOfTeams}).`
    );
  }
}

/**
 * Rejects fixed pairings the previous phase cannot produce: a `group-position` slot naming a group
 * or placing that does not qualify, or a `previous-ties` index past the previous knockout's ties.
 * The bracket builder would otherwise fail mid-season, when the phase is generated.
 */
function validateCrossings(name: string, phases: ChampionshipPhase[] | undefined): void {
  phases?.forEach((phase, index) => {
    if (phase.kind !== 'knockout' || !phase.crossings) return;

    const previous = phases[index - 1];
    const { crossings } = phase;
    const where = `Crossings of ${name} phase '${phase.name}'`;

    if (crossings.pairs.length !== phase.numberOfTies) {
      throw new Error(
        `${where} declare ${crossings.pairs.length} pairs for ${phase.numberOfTies} ties.`
      );
    }

    if (crossings.from === 'group-position') {
      if (previous?.kind !== 'round-robin') {
        throw new Error(
          `${where} read group positions, but the previous phase is not a round-robin.`
        );
      }
      for (const slot of crossings.pairs.flat()) {
        if (
          !Number.isInteger(slot.group) ||
          slot.group < 0 ||
          slot.group >= previous.numberOfGroups ||
          !Number.isInteger(slot.position) ||
          slot.position < 1 ||
          slot.position > previous.advancingPerGroup
        ) {
          throw new Error(
            `${where} name group ${slot.group} position ${slot.position}, which '${previous.name}' (${previous.numberOfGroups} groups, ${previous.advancingPerGroup} advancing each) cannot produce.`
          );
        }
      }
      return;
    }

    if (previous?.kind !== 'knockout') {
      throw new Error(`${where} read previous ties, but the previous phase is not a knockout.`);
    }
    for (const tieIndex of crossings.pairs.flat()) {
      if (!Number.isInteger(tieIndex) || tieIndex < 0 || tieIndex >= previous.numberOfTies) {
        throw new Error(
          `${where} name tie ${tieIndex}, but '${previous.name}' has ${previous.numberOfTies} ties.`
        );
      }
    }
  });
}

/**
 * Rejects a `seed` tiebreaker under any hosting rule but `higher-seed`: tie resolution reads the
 * better seed off the last leg's host, which only `higher-seed` guarantees.
 */
function validateSeedTiebreakers(name: string, phases: ChampionshipPhase[] | undefined): void {
  phases?.forEach((phase) => {
    if (phase.kind !== 'knockout') return;

    for (const ties of [phase, phase.playoff]) {
      if (ties?.tiebreakers.includes('seed') && ties.secondLegHost !== 'higher-seed') {
        throw new Error(
          `${name} '${ties.name}' breaks ties on seed, which needs 'higher-seed' hosting; it declares '${ties.secondLegHost}'.`
        );
      }
    }
  });
}

/**
 * Rejects a `'phase-group-position'` promotion that cannot be read: it needs a grouped round-robin
 * phase to read, and a promotable count every group can contribute equally to (REC C Art. 5º).
 */
function validatePromotionRule(championship: ChampionshipJSONDTO): void {
  if (championship.promotionRule !== 'phase-group-position') return;

  const name = championship.internalName;
  const index = championship.promotionPhaseIndex;
  const phase = index === undefined ? undefined : championship.phases?.[index];

  if (phase?.kind !== 'round-robin' || phase.numberOfGroups < 2) {
    throw new Error(
      `Promotion of ${name} reads group positions, but promotionPhaseIndex ${index} is not a grouped round-robin phase.`
    );
  }

  const promotable = championship.numberOfPromotableTeams ?? 0;
  if (promotable % phase.numberOfGroups !== 0) {
    throw new Error(
      `Promotion of ${name} sends ${promotable} clubs up from the ${phase.numberOfGroups} groups of '${phase.name}'; the count must divide evenly.`
    );
  }
}

/**
 * Rejects a pyramid the container cannot be built from. Within `leagueType`, the tiered entries must
 * number 1, 2, 3… with no duplicate or gap, and the promotion / relegation chain must walk them in
 * that order: tier n relegates into tier n+1 and tier n+1 promotes into tier n. The top tier
 * promotes into nothing and the bottom tier relegates into nothing. An untiered entry is outside the
 * pyramid — a cup — and a division left untiered by mistake breaks its neighbours' chain check.
 */
function validateTiers(championships: ChampionshipJSONDTO[], leagueType: LeagueType): void {
  const league = championships.filter((championship) => championship.leagueType === leagueType);

  const divisions = league
    .filter((championship) => championship.tier !== undefined)
    .sort((a, b) => (a.tier as number) - (b.tier as number));

  divisions.forEach((division, index) => {
    if (division.tier !== index + 1) {
      throw new Error(
        `Tiers of the ${leagueType} pyramid must be unique and contiguous from 1; ${division.internalName} declares tier ${division.tier} where ${index + 1} was expected.`
      );
    }

    const above = divisions[index - 1];
    const below = divisions[index + 1];

    if (division.promotionChampionshipInternalName !== above?.internalName) {
      throw new Error(
        `${division.internalName} (tier ${division.tier}) promotes into ${division.promotionChampionshipInternalName ?? 'nothing'}, but tier ${index} is ${above?.internalName ?? 'nothing'}.`
      );
    }

    if (division.relegationChampionshipInternalName !== below?.internalName) {
      throw new Error(
        `${division.internalName} (tier ${division.tier}) relegates into ${division.relegationChampionshipInternalName ?? 'nothing'}, but tier ${index + 2} is ${below?.internalName ?? 'nothing'}.`
      );
    }
  });
}

export function getChampionship(
  championshipInternalName: string,
  hasTeamControlledByHuman: boolean
): Championship {
  const championshipsJSONDTO = championshipsJSON as ChampionshipJSONDTO[];
  const championshipJSONDTO = championshipsJSONDTO.find(
    (champ) => champ.internalName === championshipInternalName
  );

  if (!championshipJSONDTO) throw new Error('Championship not found.');

  validatePhaseVariants(championshipJSONDTO);
  validateCrossings(championshipJSONDTO.internalName, championshipJSONDTO.phases);
  championshipJSONDTO.phaseVariants?.forEach((variant) =>
    validateCrossings(championshipJSONDTO.internalName, variant.phases)
  );
  validateSeedTiebreakers(championshipJSONDTO.internalName, championshipJSONDTO.phases);
  validatePromotionRule(championshipJSONDTO);
  validateTiers(championshipsJSONDTO, championshipJSONDTO.leagueType);

  let mappedChampionship = {
    id: crypto.randomUUID(),
    name: championshipJSONDTO.name,
    internalName: championshipJSONDTO.internalName,
    tier: championshipJSONDTO.tier,
    numberOfTeams: championshipJSONDTO.numberOfTeams,
    targetNumberOfTeams: championshipJSONDTO.targetNumberOfTeams,
    teams: [],
    standings: [],
    matchContainer: {
      timer: 0,
      currentSeason: 0,
      currentRound: 0,
      totalRounds: 0,
      rounds: [],
    },
    type: championshipJSONDTO.type,
    leagueType: championshipJSONDTO.leagueType,
    phases: championshipJSONDTO.phases,
    phaseVariants: championshipJSONDTO.phaseVariants,
    rolloverSlotting: championshipJSONDTO.rolloverSlotting,
    hasTeamControlledByHuman,
    isPromotable: false,
    isRelegatable: false,
  } as Championship;

  const numberOfRelegatableTeams =
    'numberOfRelegatableTeams' in championshipJSONDTO
      ? Number(championshipJSONDTO.numberOfRelegatableTeams)
      : 0;
  const relegationChampionshipInternalName =
    'relegationChampionshipInternalName' in championshipJSONDTO
      ? String(championshipJSONDTO.relegationChampionshipInternalName)
      : '';
  if (numberOfRelegatableTeams > 0 && relegationChampionshipInternalName.length > 0) {
    mappedChampionship = {
      ...mappedChampionship,
      isRelegatable: true,
      numberOfRelegatableTeams,
      relegationChampionshipInternalName,
      relegationRule: championshipJSONDTO.relegationRule ?? 'table-position',
      numberOfRelegatableTeamsAtTarget: championshipJSONDTO.numberOfRelegatableTeamsAtTarget,
    };
  }

  const numberOfPromotableTeams =
    'numberOfPromotableTeams' in championshipJSONDTO
      ? Number(championshipJSONDTO.numberOfPromotableTeams)
      : 0;
  const promotionChampionshipInternalName =
    'promotionChampionshipInternalName' in championshipJSONDTO
      ? String(championshipJSONDTO.promotionChampionshipInternalName)
      : '';
  if (numberOfPromotableTeams > 0 && promotionChampionshipInternalName.length > 0) {
    mappedChampionship = {
      ...mappedChampionship,
      isPromotable: true,
      numberOfPromotableTeams,
      promotionChampionshipInternalName,
      promotionRule: championshipJSONDTO.promotionRule ?? 'table-position',
      promotionPhaseIndex: championshipJSONDTO.promotionPhaseIndex,
    };
  }

  const teams = championshipJSONDTO.teamNames
    .map((teamName) => TeamRepository.getTeam(teamName, championshipJSONDTO.leagueType))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));

  const teamsByName = new Map(
    championshipJSONDTO.teamNames.map((teamName, index) => [teamName, teams[index]])
  );

  if (teams.length !== championshipJSONDTO.teamNames.length) {
    throw new Error(
      `Number of teams found is not the same as expected. Found: ${teams.length}; Expected: ${championshipJSONDTO.teamNames.length}.`
    );
  }

  // Staggered entry: a phase may name the clubs joining at it. Resolved here, where the seed names
  // are still in scope; the domain only ever sees `Team` objects.
  const phaseEntrants = championshipJSONDTO.phases?.map((phase) =>
    phase.kind === 'knockout' && phase.entrants?.length
      ? phase.entrants
          .map((teamName) => teamsByName.get(teamName))
          .filter((team): team is NonNullable<typeof team> => Boolean(team))
      : []
  );

  if (
    phaseEntrants?.some((entrants, index) => {
      const declared = championshipJSONDTO.phases?.[index];
      return declared?.kind === 'knockout' && (declared.entrants?.length ?? 0) !== entrants.length;
    })
  ) {
    throw new Error(`Some phase entrants of ${championshipInternalName} are not seeded teams.`);
  }

  const hasLeagueTable = championshipJSONDTO.hasLeagueTable !== false;

  const standings = hasLeagueTable
    ? teams.map((team, index) => ({
        team,
        position: index + 1,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      }))
    : [];

  mappedChampionship = {
    ...mappedChampionship,
    teams,
    standings,
    hasLeagueTable,
    ...(phaseEntrants?.some((entrants) => entrants.length) ? { phaseEntrants } : {}),
  };

  return mappedChampionship;
}

export function getChampionships(leagueType?: LeagueType): Championship[] {
  const championshipsJSONDTO = championshipsJSON as ChampionshipJSONDTO[];

  if (!championshipsJSONDTO.length)
    throw new Error('No championship internal names have been found.');

  return championshipsJSONDTO
    .filter((json) => !leagueType || json.leagueType === leagueType)
    .map((json) => {
      return {
        internalName: json.internalName,
        tier: json.tier,
        name: json.name,
        leagueType: json.leagueType,
      } as Championship;
    });
}
