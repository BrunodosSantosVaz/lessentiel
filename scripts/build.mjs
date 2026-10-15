import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

if (!existsSync("entrypoints")) {
  console.log("WXT entrypoints are not implemented yet; build deferred until the extension skeleton is added.");
  process.exit(0);
}

const runner = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(runner, ["wxt", "build"], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
