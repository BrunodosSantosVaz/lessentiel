import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/regression",
  fullyParallel: false,
  workers: 1,
  timeout: 15000,
  reporter: "list",
  use: { browserName: "chromium", headless: true, trace: "retain-on-failure" },
});
