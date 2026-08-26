const { loadEnv } = require("@medusajs/framework/utils");
loadEnv("test", process.cwd());
// Local Postgres (Homebrew) has no "postgres" role; default to the OS user.
process.env.DB_USERNAME ||= require("os").userInfo().username;

module.exports = {
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true, tsx: true },
          // @swc/core here predates es2023; pin the target it understands.
          target: "es2022",
          transform: { react: { runtime: "automatic" } },
        },
      },
    ],
  },
  testEnvironment: "node",
  // tsconfig maps bare imports to ./src (`"*": ["./src/*"]`) so
  // medusa-config.ts can `from "lib/constants"`; mirror that here or
  // every integration spec dies at config load.
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  moduleFileExtensions: ["js", "ts", "tsx", "json"],
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],
};

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/**/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"];
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.unit.spec.[jt]s"];
}
