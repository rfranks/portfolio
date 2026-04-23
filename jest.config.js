module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/src/tests/**/*.test.ts", "**/src/tests/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|sass|scss)$": "<rootDir>/src/tests/mocks/styleMock.ts",
  },
  testPathIgnorePatterns: ["/src/tests/resumeIngest.test.ts", "/src/tests/useDimensions.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          jsx: "react-jsx",
        },
      },
    ],
  },
};
