import { spawnSync } from "node:child_process";
import process from "node:process";

const runner = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(runner, ["wxt", "zip"], {
  stdio: "inherit",
  env: { ...process.env, MLA_FEATURE_READER: "true", MLA_TEST_MODE: "false" },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
