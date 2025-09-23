module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/src/tests/**/*.test.ts', '**/src/tests/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/src/tests/resumeIngest.test.ts'],
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'commonjs',
        jsx: 'react-jsx',
      },
    },
  },
};
