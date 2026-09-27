import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "src/algorithms/**/*.ts",
    "src/utils/**/*.ts",
    "src/validators/**/*.ts"
  ],
  clearMocks: true,
  verbose: true
};

export default config;
