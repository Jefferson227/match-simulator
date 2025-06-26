import '@testing-library/jest-dom';

// Extend the expect matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toBeDisabled(): R;
    }
  }
}

// Add Jest globals to the global scope
declare global {
  const describe: typeof import('@jest/globals').describe;
  const test: typeof import('@jest/globals').test;
  const it: typeof import('@jest/globals').it;
  const expect: typeof import('@jest/globals').expect;
  const beforeEach: typeof import('@jest/globals').beforeEach;
  const afterEach: typeof import('@jest/globals').afterEach;
  const beforeAll: typeof import('@jest/globals').beforeAll;
  const afterAll: typeof import('@jest/globals').afterAll;
  const jest: typeof import('@jest/globals').jest;
}
