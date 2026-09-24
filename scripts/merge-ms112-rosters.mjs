#!/usr/bin/env node
/**
 * MS-112: rebuilds `teams.json` and `teams-womens.json` from the 2026 input rosters.
 *
 * The input is one JSON file per club (ogol.com.br, retrieved 2026-09), laid out as
 * `mens/brasileirao-serie-{a,b,c,d}/<slug>.json` and `womens/brasileirao-feminino-a{1,2,3}/<slug>.json`.
 * It lives in the gitignored `.plans/MS-112/input/teams`, so its directory is an argument.
 *
 * For every club with an input file: `name`, `shortName`, the whole squad (positions, names, ages,
 * nationalities as ISO 3166-1 alpha-3 codes, England as FIFA's ENG) and the coach come from the
 * input; `internalName`, `abbreviation`, `colors` and `initialOverallStrength` are kept. The 44
 * men's clubs new to the seed are added with a derived abbreviation, researched colours and a
 * strength inside Série D's 43 → 28 band. The men's clubs in no 2026 division are removed.
 *
 * Deterministic and re-runnable: a second run over its own output writes the same bytes. It fails on
 * an unknown nationality, an unmapped input or a seed club left without input.
 *
 * Usage: node scripts/merge-ms112-rosters.mjs <input-dir>
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../src/infrastructure/data'
);

// Country names exactly as the input spells them (note the U+2019 in Côte d’Ivoire). UK home
// nations take FIFA codes, since ISO 3166-1 has only GBR.
const NATIONALITY_CODES = {
  Angola: 'AGO',
  Argentina: 'ARG',
  Azerbaijan: 'AZE',
  Belgium: 'BEL',
  Benin: 'BEN',
  Bolivia: 'BOL',
  Brazil: 'BRA',
  Bulgaria: 'BGR',
  Cameroon: 'CMR',
  Canada: 'CAN',
  'Cape Verde': 'CPV',
  Chile: 'CHL',
  Colombia: 'COL',
  'Congo - Kinshasa': 'COD',
  Croatia: 'HRV',
  'Côte d’Ivoire': 'CIV',
  Denmark: 'DNK',
  Ecuador: 'ECU',
  England: 'ENG',
  'Equatorial Guinea': 'GNQ',
  France: 'FRA',
  Germany: 'DEU',
  Ghana: 'GHA',
  Guinea: 'GIN',
  'Guinea-Bissau': 'GNB',
  Guyana: 'GUY',
  Haiti: 'HTI',
  Italy: 'ITA',
  Japan: 'JPN',
  Lithuania: 'LTU',
  Luxembourg: 'LUX',
  Mexico: 'MEX',
  Monaco: 'MCO',
  Morocco: 'MAR',
  Netherlands: 'NLD',
  Nigeria: 'NGA',
  Panama: 'PAN',
  Paraguay: 'PRY',
  Peru: 'PER',
  Poland: 'POL',
  Portugal: 'PRT',
  Senegal: 'SEN',
  Serbia: 'SRB',
  'South Korea': 'KOR',
  Spain: 'ESP',
  'St. Vincent & Grenadines': 'VCT',
  Sweden: 'SWE',
  Switzerland: 'CHE',
  Syria: 'SYR',
  'São Tomé & Príncipe': 'STP',
  Togo: 'TGO',
  Turkey: 'TUR',
  'United States': 'USA',
  Uruguay: 'URY',
  Venezuela: 'VEN',
  Scotland: 'SCO',
  Wales: 'WAL',
  'Northern Ireland': 'NIR',
};

const MENS_SLUG_TO_INTERNAL_NAME = {
  'atletico-mineiro': 'atletico-mg',
  'red-bull-bragantino': 'rb-bragantino',
  'america-mineiro': 'america-mg',
  'athletic-mg': 'athletic',
  'atletico-goianiense': 'atletico-go',
  'gremio-novorizontino': 'novorizontino',
  'operario-ferroviario': 'operario-pr',
  sport: 'sport-recife',
  'amazonas-fc': 'amazonas',
  'barra-sc': 'barra',
  'floresta-ce': 'floresta',
  'ypiranga-rs': 'ypiranga',
  aguia: 'aguia-de-maraba',
  'azuriz-futebol': 'azuriz',
  'capital-cf': 'capital-df',
  'ec-agua-santa': 'agua-santa',
  'fc-cascavel': 'cascavel',
  ferroviario: 'ferroviario-ce',
  gas: 'gremio-sampaio',
  'gazin-porto-velho-ec': 'porto-velho',
  'ge-brasil': 'brasil-de-pelotas',
  'goiatuba-ec': 'goiatuba',
  'independencia-ac': 'independencia',
  'lagarto-se': 'lagarto',
  'manauara-ec': 'manauara',
  'manaus-fc': 'manaus',
  'retro-fc': 'retro',
  'sc-humaita': 'humaita',
};

const WOMENS_SLUG_TO_INTERNAL_NAME = {
  'america-mineiro': 'america',
  juventude: 'juventude-rs',
  mixto: 'mixto-mt',
  '3b-da-amazonia': 'instituto-3b',
  'ad-taubate': 'desportiva-taubate',
  'atletico-piauiense': 'cap',
  'itabirito-fc': 'itabirito',
  'itacoatiara-fc': 'itacoatiara',
  'minas-brasilia-ff': 'minas-brasilia',
  'rio-negro-rr': 'atletico-rio-negro',
  sport: 'sport-recife',
  'uniao-desportiva': 'uda',
  vasco: 'vasco-da-gama',
  'atletico-ba': 'atletico-de-alagoinhas',
  'cresspom-df': 'cresspom',
  'fc-pantanal': 'pantanal',
  'galvez-ec': 'galvez',
  'gremio-mauaense': 'mauaense',
  'guarani-paripueira': 'guarani-de-paripueira',
  'penarol-am': 'penarol',
  'portuguesa-ap': 'portuguesa',
  'sao-raimundo-rr': 'sao-raimundo',
  'tiradentes-pa': 'tiradentes',
  'uniao-de-natal': 'uniao',
  'ypiranga-ap': 'ypiranga',
};

const ORPHANS = [
  'barcelona-de-ilheus',
  'boavista',
  'goianesia',
  'goiania',
  'horizonte',
  'itabirito',
  'jequie',
  'monte-azul',
  'penedense',
  'porto-vitoria',
  'santa-cruz-rn',
  'uniao-araguainense',
];

// Série D 2026 1ª Fase record (CBF phase-2040 standings): [group, position, points, wins, goal difference, goals for].
const NEW_CLUBS = {
  'abecat-ouvidorense': {
    record: ['A11', 5, 12, 3, -1, 8],
    colors: { outline: '#1b1817', background: '#e6610a', name: '#1b1817' },
  },
  'america-rj': {
    record: ['A13', 4, 12, 3, -10, 11],
    colors: { outline: '#ffffff', background: '#e00000', name: '#ffffff' },
  },
  araguaina: {
    record: ['A02', 3, 18, 5, 22, 31],
    colors: { outline: '#0000ff', background: '#ff0000', name: '#000000' },
  },
  'atletico-ba': {
    record: ['A10', 6, 5, 1, -15, 5],
    colors: { outline: '#000000', background: '#ff0000', name: '#000000' },
  },
  'atletico-cearense': {
    record: ['A07', 6, 7, 1, -8, 6],
    colors: { outline: '#000000', background: '#ff0000', name: '#000000' },
  },
  'betim-futebol': {
    record: ['A11', 2, 15, 4, 3, 12],
    colors: { outline: '#fb0201', background: '#0001fb', name: '#ffffff' },
  },
  blumenau: {
    record: ['A16', 1, 19, 6, 6, 14],
    colors: { outline: '#01613c', background: '#6e081e', name: '#ffffff' },
  },
  brasiliense: {
    record: ['A03', 3, 14, 3, 1, 11],
    colors: { outline: '#059946', background: '#f6dc03', name: '#000000' },
  },
  'ceov-operario': {
    record: ['A04', 6, 5, 1, -9, 7],
    colors: { outline: '#ffffff', background: '#ff0000', name: '#000000' },
  },
  crac: {
    record: ['A11', 3, 13, 3, 0, 7],
    colors: { outline: '#ffffff', background: '#0079ff', name: '#000000' },
  },
  cse: {
    record: ['A10', 5, 9, 2, -7, 10],
    colors: { outline: '#006600', background: '#ff0000', name: '#000000' },
  },
  decisao: {
    record: ['A09', 6, 8, 2, -7, 10],
    colors: { outline: '#ffffff', background: '#000066', name: '#ffffff' },
  },
  'democrata-gv': {
    record: ['A12', 1, 17, 5, 4, 13],
    colors: { outline: '#000000', background: '#ffffff', name: '#000000' },
  },
  'fluminense-pi': {
    record: ['A07', 3, 14, 3, 3, 12],
    colors: { outline: '#9f0028', background: '#005524', name: '#ffffff' },
  },
  'galvez-ec': {
    record: ['A02', 5, 10, 3, -17, 14],
    colors: { outline: '#003604', background: '#ffff00', name: '#003604' },
  },
  gama: {
    record: ['A03', 1, 26, 8, 17, 23],
    colors: { outline: '#ffffff', background: '#016637', name: '#ffffff' },
  },
  guapore: {
    record: ['A02', 1, 22, 6, 10, 19],
    colors: { outline: '#189853', background: '#f5811e', name: '#000000' },
  },
  iape: {
    record: ['A06', 6, 4, 0, -10, 10],
    colors: { outline: '#362d59', background: '#eae435', name: '#362d59' },
  },
  inhumas: {
    record: ['A03', 6, 1, 0, -17, 3],
    colors: { outline: '#ffffff', background: '#770000', name: '#ffffff' },
  },
  ivinhema: {
    record: ['A11', 4, 13, 3, -3, 9],
    colors: { outline: '#ffffff', background: '#0033cc', name: '#ffffff' },
  },
  jacuipense: {
    record: ['A10', 4, 13, 3, -2, 12],
    colors: { outline: '#e3e2d3', background: '#650d18', name: '#e3e2d3' },
  },
  laguna: {
    record: ['A08', 6, 2, 0, -17, 3],
    colors: { outline: '#001155', background: '#ff5ff8', name: '#001155' },
  },
  madureira: {
    record: ['A13', 5, 11, 3, -5, 11],
    colors: { outline: '#ffe000', background: '#830000', name: '#ffe000' },
  },
  'maguary-pe': {
    record: ['A08', 3, 13, 3, 3, 8],
    colors: { outline: '#ffffff', background: '#0000bb', name: '#ffffff' },
  },
  'monte-roraima': {
    record: ['A01', 4, 10, 2, -3, 11],
    colors: { outline: '#f6bf25', background: '#0d5027', name: '#f6bf25' },
  },
  'moto-club': {
    record: ['A06', 5, 9, 2, -7, 8],
    colors: { outline: '#fc0101', background: '#020101', name: '#fc0101' },
  },
  'nacional-am': {
    record: ['A01', 2, 20, 6, 6, 15],
    colors: { outline: '#ffffff', background: '#0055ff', name: '#ffffff' },
  },
  noroeste: {
    record: ['A14', 2, 15, 4, 5, 12],
    colors: { outline: '#ffffff', background: '#ff0000', name: '#000000' },
  },
  oratorio: {
    record: ['A05', 6, 4, 1, -17, 12],
    colors: { outline: '#ffffff', background: '#069af3', name: '#000000' },
  },
  piaui: {
    record: ['A07', 2, 17, 5, 3, 14],
    colors: { outline: '#e20139', background: '#223d7a', name: '#ffffff' },
  },
  'porto-ba': {
    record: ['A12', 5, 10, 3, -12, 9],
    colors: { outline: '#ffdc00', background: '#dc0000', name: '#ffffff' },
  },
  'portuguesa-rj': {
    record: ['A13', 3, 14, 3, 5, 14],
    colors: { outline: '#005b00', background: '#ff0000', name: '#000000' },
  },
  'primavera-ac': {
    record: ['A03', 5, 12, 3, -3, 10],
    colors: { outline: '#ffffff', background: '#580e89', name: '#ffffff' },
  },
  'real-noroeste': {
    record: ['A12', 6, 8, 1, -5, 6],
    colors: { outline: '#ff0000', background: '#ffffff', name: '#000000' },
  },
  'sampaio-correa-rj': {
    record: ['A14', 4, 12, 3, -2, 8],
    colors: { outline: '#fbc436', background: '#044997', name: '#fbc436' },
  },
  'santa-catarina': {
    record: ['A15', 1, 19, 6, 6, 15],
    colors: { outline: '#000000', background: '#ff6600', name: '#000000' },
  },
  'sao-joseense': {
    record: ['A16', 3, 13, 3, -1, 3],
    colors: { outline: '#ffffff', background: '#162668', name: '#ffffff' },
  },
  'sao-raimundo-rr': {
    record: ['A01', 3, 13, 3, 3, 10],
    colors: { outline: '#ffffff', background: '#0000dd', name: '#ffffff' },
  },
  'serra-branca-pb': {
    record: ['A09', 3, 15, 3, 4, 12],
    colors: { outline: '#20913a', background: '#114373', name: '#ffffff' },
  },
  tirol: {
    record: ['A07', 5, 10, 2, 0, 10],
    colors: { outline: '#000000', background: '#023b9c', name: '#ffffff' },
  },
  'uniao-rondonopolis': {
    record: ['A04', 5, 9, 2, -7, 11],
    colors: { outline: '#ffffff', background: '#ff0000', name: '#000000' },
  },
  'velo-clube': {
    record: ['A14', 3, 13, 3, 0, 10],
    colors: { outline: '#ffffff', background: '#ff0000', name: '#000000' },
  },
  'vitoria-es': {
    record: ['A12', 3, 15, 4, 4, 12],
    colors: { outline: '#ffffff', background: '#0000ff', name: '#ffffff' },
  },
  'xv-de-piracicaba': {
    record: ['A14', 1, 17, 4, 5, 14],
    colors: { outline: '#000000', background: '#ffffff', name: '#000000' },
  },
};

const PARTICLES = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E']);

// Série D's band (MS-106): the new clubs are spread over it by their 2026 1ª Fase record.
const STRENGTH_TOP = 43;
const STRENGTH_BOTTOM = 28;

function readInputs(inputDir, leagueDir) {
  const root = path.join(inputDir, leagueDir);
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .flatMap((division) =>
      fs
        .readdirSync(path.join(root, division))
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => ({
          slug: file.slice(0, -'.json'.length),
          where: `${leagueDir}/${division}/${file}`,
          data: JSON.parse(fs.readFileSync(path.join(root, division, file), 'utf8')),
        }))
    );
}

function toCodes(names, where) {
  return names.map((name) => {
    const code = NATIONALITY_CODES[name];
    if (!code) throw new Error(`Unknown nationality '${name}' in ${where}.`);
    return code;
  });
}

function mapPlayers(input) {
  return input.data.players.map((player) => ({
    position: player.positionCode,
    name: player.name,
    age: player.age,
    nationalities: toCodes(player.nationalities, input.where),
  }));
}

function mapCoach(input) {
  const coach = input.data.coach;
  if (!coach) return undefined;
  return {
    name: coach.name,
    age: coach.age,
    ...(coach.nationalities && { nationalities: toCodes(coach.nationalities, input.where) }),
  };
}

function buildClub(input, kept) {
  const coach = mapCoach(input);
  return {
    name: input.data.teamFullName,
    internalName: kept.internalName,
    shortName: input.data.teamShortName,
    abbreviation: kept.abbreviation,
    colors: kept.colors,
    initialOverallStrength: kept.initialOverallStrength,
    ...(coach && { coach }),
    players: mapPlayers(input),
  };
}

/**
 * MS-106's rule: from `shortName`, particles skipped — the first three letters, then the initial
 * plus the first two letters of each later word, the initials of the first three words, the first
 * two letters plus a later word's initial, then the initial plus any two later letters of the first
 * word, in order.
 */
function abbreviationCandidates(shortName) {
  const words = shortName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((word) => word && !PARTICLES.has(word));
  const [first = '', ...rest] = words;
  const candidates = [first.slice(0, 3)];
  for (const word of rest) candidates.push(first[0] + word.slice(0, 2));
  if (words.length >= 3)
    candidates.push(
      words
        .slice(0, 3)
        .map((word) => word[0])
        .join('')
    );
  for (const word of rest) candidates.push(first.slice(0, 2) + word[0]);
  for (let i = 1; i < first.length; i++) {
    for (let j = i + 1; j < first.length; j++) candidates.push(first[0] + first[i] + first[j]);
  }
  return candidates.filter((candidate) => /^[A-Z0-9]{3}$/.test(candidate));
}

/** Best 2026 1ª Fase record first: group position, then points, wins, goal difference, goals for. */
function newClubStrengths() {
  const ranked = Object.entries(NEW_CLUBS)
    .map(([slug, { record }]) => ({ slug, record }))
    .sort((a, b) => {
      const [, posA, ptsA, winsA, gdA, gfA] = a.record;
      const [, posB, ptsB, winsB, gdB, gfB] = b.record;
      return (
        posA - posB ||
        ptsB - ptsA ||
        winsB - winsA ||
        gdB - gdA ||
        gfB - gfA ||
        (a.slug < b.slug ? -1 : 1)
      );
    });
  const step = (STRENGTH_TOP - STRENGTH_BOTTOM) / (ranked.length - 1);
  return new Map(ranked.map(({ slug }, index) => [slug, Math.round(STRENGTH_TOP - step * index)]));
}

/** Inserts each club before the first one whose key sorts after it, keeping the file's order. */
function insertAlphabetically(clubs, added) {
  const result = [...clubs];
  for (const club of [...added].sort((a, b) => (a.internalName < b.internalName ? -1 : 1))) {
    const index = result.findIndex((existing) => existing.internalName > club.internalName);
    result.splice(index === -1 ? result.length : index, 0, club);
  }
  return result;
}

function indexInputs(inputs, slugMap) {
  const byInternalName = new Map();
  for (const input of inputs) {
    const internalName = slugMap[input.slug] ?? input.slug;
    if (byInternalName.has(internalName)) {
      throw new Error(`Two inputs map to '${internalName}': ${input.where}.`);
    }
    byInternalName.set(internalName, input);
  }
  return byInternalName;
}

function mergeMens(inputDir) {
  const seed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'teams.json'), 'utf8'));
  const inputs = indexInputs(readInputs(inputDir, 'mens'), MENS_SLUG_TO_INTERNAL_NAME);
  const isNew = (internalName) => internalName in NEW_CLUBS;

  const kept = seed
    .filter((club) => !ORPHANS.includes(club.internalName) && !isNew(club.internalName))
    .map((club) => {
      const input = inputs.get(club.internalName);
      if (!input) throw new Error(`Men's seed club '${club.internalName}' has no input file.`);
      return buildClub(input, club);
    });

  for (const internalName of inputs.keys()) {
    if (!isNew(internalName) && !kept.some((club) => club.internalName === internalName)) {
      throw new Error(`Input '${internalName}' matches no seed club and is not a new club.`);
    }
  }

  const used = new Set(kept.map((club) => club.abbreviation));
  const strengths = newClubStrengths();
  // Abbreviations are handed out in Série D group order, as MS-106 did.
  const added = Object.keys(NEW_CLUBS)
    .sort((a, b) => {
      const [groupA, posA] = NEW_CLUBS[a].record;
      const [groupB, posB] = NEW_CLUBS[b].record;
      return groupA < groupB ? -1 : groupA > groupB ? 1 : posA - posB;
    })
    .map((slug) => {
      const input = inputs.get(slug);
      if (!input) throw new Error(`New club '${slug}' has no input file.`);
      const abbreviation = abbreviationCandidates(input.data.teamShortName).find(
        (candidate) => !used.has(candidate)
      );
      if (!abbreviation) throw new Error(`No free abbreviation for '${slug}'.`);
      used.add(abbreviation);
      return buildClub(input, {
        internalName: slug,
        abbreviation,
        colors: NEW_CLUBS[slug].colors,
        initialOverallStrength: strengths.get(slug),
      });
    });

  return insertAlphabetically(kept, added);
}

function mergeWomens(inputDir) {
  const seed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'teams-womens.json'), 'utf8'));
  const inputs = indexInputs(readInputs(inputDir, 'womens'), WOMENS_SLUG_TO_INTERNAL_NAME);
  if (inputs.size !== seed.length) {
    throw new Error(`Women's input has ${inputs.size} clubs; the seed has ${seed.length}.`);
  }

  return seed.map((club) => {
    const input = inputs.get(club.internalName);
    if (!input) throw new Error(`Women's seed club '${club.internalName}' has no input file.`);
    return buildClub(input, club);
  });
}

const inputDir = process.argv[2];
if (!inputDir) {
  console.error('Usage: node scripts/merge-ms112-rosters.mjs <input-dir>');
  process.exit(1);
}

const mens = mergeMens(inputDir);
const womens = mergeWomens(inputDir);
fs.writeFileSync(path.join(DATA_DIR, 'teams.json'), `${JSON.stringify(mens, null, 2)}\n`);
fs.writeFileSync(path.join(DATA_DIR, 'teams-womens.json'), `${JSON.stringify(womens, null, 2)}\n`);
console.log(`teams.json: ${mens.length} clubs; teams-womens.json: ${womens.length} clubs.`);
