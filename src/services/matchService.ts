const FORMATIONS = [
  '5-3-2',
  '3-5-2',
  '4-4-2',
  '4-3-3',
  '4-2-4',
  '5-4-1',
  '3-4-3',
  '3-3-4',
];

function getRandomFormation(): string {
  return FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];
}

function getAllFormations(): string[] {
  return FORMATIONS;
}

const matchService = { getRandomFormation, getAllFormations };

export default matchService;
