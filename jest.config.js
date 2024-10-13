module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./setupTests.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
