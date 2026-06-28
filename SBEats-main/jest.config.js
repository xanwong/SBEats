module.exports = {
  preset: "jest-expo",
  watchman: false,
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/SBEats/$1",
  },
};
