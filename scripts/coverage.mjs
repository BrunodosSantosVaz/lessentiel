import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

if (!["src/domain", "src/application"].some(existsSync)) {
  console.log("No application modules yet; coverage starts with the implementation tasks.");
  process.exit(0);
}

const runner = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(runner, ["vitest", "run", "--coverage"], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
