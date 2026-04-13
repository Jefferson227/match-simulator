/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^~domain/(.*)$': '<rootDir>/src/domain/$1',
    '^~game-engine/(.*)$': '<rootDir>/src/game-engine/$1',
    '^~infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^~presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^~reducers/(.*)$': '<rootDir>/src/reducers/$1',
    '^~services/(.*)$': '<rootDir>/src/services/$1',
    '^~use-cases/(.*)$': '<rootDir>/src/use-cases/$1',
    '^~utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
};

module.exports = config;
