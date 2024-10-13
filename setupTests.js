import '@testing-library/jest-dom'; // Import jest-dom for extended matchers

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mocked-uuid'),
  },
});
