import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/aceite",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 10000,
  reporter: "list",
  use: { browserName: "chromium", headless: true, trace: "retain-on-failure" },
});
