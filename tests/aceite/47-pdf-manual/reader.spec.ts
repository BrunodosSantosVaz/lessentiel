import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

test("RN-0006 CA-10 PDF local permanece nativo até ação explícita e retorna ao fechar", async () => {
  const extension = process.env.MLA_EXTENSION_DIR ?? resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, "--allow-file-access-from-files"],
  });
  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
    const id = new URL(worker.url()).host;
    const controls = await context.newPage();
    await controls.goto(`chrome://extensions/?id=${id}`);
    const access = controls.locator("#allow-file-access").locator("cr-toggle");
    if ((await access.count()) && (await access.getAttribute("checked")) === null) await access.click();
    expect(await worker.evaluate(() => (globalThis as any).chrome.extension.isAllowedFileSchemeAccess())).toBe(true);
    const page = await context.newPage();
    const file = new URL(`file://${resolve("tests/fixtures/sample.pdf")}`).href;
    await page.goto(file);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(file);
    await expect(page.locator("[data-leitor-limpo-host]")).toHaveCount(0);
    await controls.goto(`chrome-extension://${id}/popup.html`);
    await page.bringToFront();
    expect(await controls.evaluate(() => (globalThis as any).chrome.runtime.sendMessage({ type: "ACTIVATE_READER" }))).toBe(true);
    await expect(page.getByRole("article")).toContainText("PDF de teste");
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(file);
    await expect(page.locator("[data-leitor-limpo-host]")).toHaveCount(0);
  } finally {
    await context.close();
  }
});
