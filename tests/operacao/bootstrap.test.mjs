import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

const output = (command, args) => execFileSync(command, args, { encoding: "utf8" }).trim();

test("repository matches the canonical Git origin", () => {
  const origin = output("git", ["remote", "get-url", "origin"]);
  const repository = origin.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1];
  assert.ok(repository, "Expected a GitHub origin");
  const configured = output("python3", [
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

test("generated controls match the configuration", () => {
  output("python3", [".bigbang/bin/bb.py", "verify"]);
});
