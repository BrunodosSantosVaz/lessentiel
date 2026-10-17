import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("#60 RN-0004 keeps the installed version stable when packaging a candidate", async () => {
  vi.stubEnv("BB_RC", "4");
  vi.resetModules();
  const { default: config } = await import("../../wxt.config");
  const { version } = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  expect(config.manifest).toMatchObject({ version_name: version });
});
