import utils from './utils';

const { addPlayerAttributes } = utils;

describe('addPlayerAttributes', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should add an id and order to each player and sort them by position', () => {
    const players = [
      { name: 'Player 1', position: 'FW' },
      { name: 'Player 2', position: 'GK' },
      { name: 'Player 3', position: 'DF' },
      { name: 'Player 4', position: 'MF' },
    ];

    const result = addPlayerAttributes(players);

    expect(result).toEqual([
      { name: 'Player 2', position: 'GK', id: 'mocked-uuid', order: 0 }, // GK should be first
      { name: 'Player 3', position: 'DF', id: 'mocked-uuid', order: 1 }, // DF should be second
      { name: 'Player 4', position: 'MF', id: 'mocked-uuid', order: 2 }, // MF should be third
      { name: 'Player 1', position: 'FW', id: 'mocked-uuid', order: 3 }, // FW should be last
    ]);

    expect(crypto.randomUUID).toHaveBeenCalledTimes(4); // 4 players, so 4 calls
  });

  it('should assign order 0 to players with unknown positions and sort them as goalkeepers', () => {
    const players = [
      { name: 'Player 1', position: 'FW' },
      { name: 'Player 2', position: 'Unknown' }, // Unknown position should default to GK order (0)
    ];

    const result = addPlayerAttributes(players);

    expect(result).toEqual([
      { name: 'Player 2', position: 'Unknown', id: 'mocked-uuid', order: 0 }, // Default to GK order
      { name: 'Player 1', position: 'FW', id: 'mocked-uuid', order: 3 }, // FW should be last
    ]);

    expect(crypto.randomUUID).toHaveBeenCalledTimes(2); // 2 players, so 2 calls
  });

  it('should return an empty array when given an empty players array', () => {
    const players = [];
    const result = addPlayerAttributes(players);
    expect(result).toEqual([]);
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  });
});
