import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

async function open() {
  const path = resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    viewport: { width: 360, height: 900 },
    args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`],
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  return { context, page, worker, base: `chrome-extension://${id}` };
}

test("#40 RN-0004 identidade L’Essentiel e ícones claro/escuro estão no pacote e nas telas", async () => {
  const { context, page, worker, base } = await open();
  try {
    const manifest = await worker.evaluate(() => (globalThis as any).chrome.runtime.getManifest());
    expect(manifest.name).toBe("L’Essentiel");
    for (const size of [16, 32, 48, 128]) expect(manifest.icons[size]).toBe(`icons/light/icon-${size}.png`);
    for (const screen of ["popup", "options", "pdf"]) {
      await page.goto(`${base}/${screen}.html`);
      await expect(page.locator(".brand")).toContainText("L’Essentiel");
      await expect(page).toHaveTitle(/L’Essentiel/);
      for (const colorScheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme });
        await expect.poll(() => page.locator(".brand img").evaluate((image: HTMLImageElement) => image.currentSrc)).toContain(`/icons/${colorScheme}/icon.svg`);
        await expect.poll(() => page.locator(".brand img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator("body")).not.toContainText("Leitor Limpo");
    }
  } finally {
    await context.close();
  }
});

test("#40 RN-0004 informações e links acessíveis sem alterar preferências de leitura", async () => {
  const { context, page, worker, base } = await open();
  try {
    await worker.evaluate(() =>
      (globalThis as any).chrome.storage.local.set({ readerPreferences: { language: "pt-BR", theme: "sepia", fontSize: 22, showImages: true } }),
    );
    await page.goto(`${base}/options.html`);
    const about = page.getByRole("region", { name: "Sobre o L’Essentiel", exact: true });
    await expect(about).toBeVisible();
    await expect(about.locator("#app-version")).toContainText("0.1.0");
    await expect(about).toContainText("MIT");
    await expect(about.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute("href", "https://github.com/BrunodosSantosVaz/lessentiel");
    await expect(about.getByRole("link", { name: "Documentação", exact: true })).toHaveAttribute(
      "href",
      "https://github.com/BrunodosSantosVaz/lessentiel/wiki",
    );
    await expect(about.getByRole("link", { name: "Relatar problema", exact: true })).toHaveAttribute(
      "href",
      "https://github.com/BrunodosSantosVaz/lessentiel/issues",
    );
    await page.getByRole("combobox", { name: "Idioma", exact: true }).selectOption("en");
    await expect(page.getByRole("heading", { name: "About L’Essentiel", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Save preferences", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Preferences saved" })).toBeVisible();
    expect(await worker.evaluate(async () => (await (globalThis as any).chrome.storage.local.get("readerPreferences")).readerPreferences)).toEqual({
      language: "en",
      theme: "sepia",
      fontSize: 22,
      showImages: true,
    });
    const links = await about.locator("a").evaluateAll((nodes) => nodes.map((node) => ({ height: node.getBoundingClientRect().height, rel: node.rel })));
    expect(links.every((link) => link.height >= 44 && link.rel.includes("noopener"))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});
