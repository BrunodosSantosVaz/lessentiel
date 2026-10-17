import { strict as assert } from "node:assert";
import { execFile } from "node:child_process";
import { test } from "node:test";
import { promisify } from "node:util";

const execute = promisify(execFile);
const output = async (command, args) =>
  (await execute(command, args, { encoding: "utf8" })).stdout.trim();

test("repository matches the canonical Git origin", async () => {
  const origin = await output("git", ["remote", "get-url", "origin"]);
  const repository = origin.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1];
  assert.ok(repository, "Expected a GitHub origin");
  const configured = await output("python3", [
    ".bigbang/bin/bb.py",
    "config",
    "get",
    "projeto.repositorio",
  ]);
  assert.equal(
    configured,
    repository,
    "API mutations must use the canonical repository, without redirects",
  );
});

test("generated controls match the configuration", async () => {
  await output("python3", [".bigbang/bin/bb.py", "verify"]);
});
