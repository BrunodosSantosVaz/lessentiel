import { chooseReaderAlignment, revealReaderControl } from "../helpers/reader-controls";
import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

const url = "https://reading.test/layout";
const html = `<!doctype html><title>Leitura de demonstração</title><article><h1>Leitura de demonstração</h1><p>${"Um texto fictício para conferir o espaço e o ritmo da leitura. ".repeat(12)}</p><h2>Segunda parte</h2>${`<p>${"Conteúdo fictício, sem informações pessoais. ".repeat(12)}</p>`.repeat(30)}</article>`;
async function open(width = 1440) {
  const extensionPath = resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    viewport: { width, height: 900 },
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  await context.route(/^https?:\/\//, (route) =>
    route.request().url() === url ? route.fulfill({ contentType: "text/html; charset=utf-8", body: html }) : route.abort(),
  );
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const page = await context.newPage();
  const activate = () =>
    worker.evaluate(async (url) => {
      const api = (globalThis as any).chrome;
      const tab = (await api.tabs.query({})).find((t: any) => t.url === url);
      await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/reader.js"] });
    }, url);
  await page.goto(url);
  await activate();
  const article = page.locator("[data-leitor-limpo-host] article");
  await expect(article).toBeVisible();
  return { context, page, article, activate, worker };
}

test("#32 RN-0002 barra usa grupos horizontais e cores neutras da referência", async () => {
  const { context, page } = await open();
  try {
    const group = page.locator(".theme-group");
    await expect(group).toHaveCSS("flex-direction", "row");
    await expect(group.locator(".theme-preview .theme-swatch")).toHaveCount(5);
    await expect(page.locator(".toolbar")).toHaveCSS("color", "rgb(34, 34, 34)");
    await expect(page.locator(".toolbar")).toHaveCSS("font-family", /Segoe UI/);
    expect((await page.locator(".toolbar").boundingBox())!.height).toBeLessThanOrEqual(140);
  } finally {
    await context.close();
  }
});

test("#32 RN-0002 índice fica à esquerda do artigo e permanece lateral ao rolar", async () => {
  const { context, page, article } = await open();
  try {
    const toolbar = page.locator(".toolbar");
    const before = (await toolbar.boundingBox())!.height;
    await page.getByRole("button", { name: "Índice", exact: true }).click();
    const index = page.getByRole("navigation", { name: "Índice do artigo", exact: true });
    await expect(index).toBeVisible();
    const box = (await index.boundingBox())!;
    const text = (await article.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(text.x);
    expect((await toolbar.boundingBox())!.height).toBe(before);
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect(index).toBeInViewport();
    expect((await index.boundingBox())!.y).toBeGreaterThanOrEqual(before - 1);
    await index.getByRole("link", { name: "Segunda parte", exact: true }).click();
    await expect(page).toHaveURL(/#segunda-parte/);
    const heading = (await article.getByRole("heading", { name: "Segunda parte" }).boundingBox())!;
    expect(heading.y).toBeGreaterThanOrEqual(before);
    await page.getByRole("button", { name: "Recolher navegação", exact: true }).click();
    await expect(index).toBeHidden();
  } finally {
    await context.close();
  }
});

test("#32 RN-0002 centraliza texto e ocupa 100% em monitores largos, persistindo ambos", async () => {
  const { context, page, article, activate, worker } = await open(1920);
  try {
    await chooseReaderAlignment(page, "Centralizado");
    await expect(article).toHaveCSS("text-align", "center");
    const width = page.getByRole("slider", { name: "Largura do texto", exact: true });
    await revealReaderControl(page, width);
    await width.focus();
    await width.press("End");
    expect((await article.boundingBox())!.width).toBeGreaterThanOrEqual(1824);
    await expect(width).toHaveAttribute("aria-valuetext", /100%/);
    await expect
      .poll(() => worker.evaluate(async () => (await (globalThis as any).chrome.storage.local.get("readerPreferences")).readerPreferences.widthMode))
      .toBe("full");
    await page.reload();
    await activate();
    await expect(page.locator('select[aria-label="Alinhamento do texto"]')).toHaveValue("center");
    await expect(article).toHaveCSS("text-align", "center");
    expect((await article.boundingBox())!.width).toBeGreaterThanOrEqual(1824);
    await page.getByRole("button", { name: "Índice", exact: true }).click();
    expect((await article.boundingBox())!.width).toBeGreaterThan(1500);
    await revealReaderControl(page, width);
    await width.focus();
    await width.press("Home");
    await expect(article).toHaveCSS("max-width", "30%");
    await page.setViewportSize({ width: 360, height: 900 });
    await expect.poll(() => page.locator(".veil").evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  } finally {
    await context.close();
  }
});

test("#32 RN-0002 índice móvel fecha por Escape sem fechar o leitor e devolve foco", async () => {
  const { context, page, article } = await open(360);
  try {
    const button = page.getByRole("button", { name: "Índice", exact: true });
    await button.click();
    const index = page.getByRole("navigation", { name: "Índice do artigo", exact: true });
    await expect(index).toBeInViewport();
    const bounds = (await index.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(360);
    await page.keyboard.press("Escape");
    await expect(index).toBeHidden();
    await expect(article).toBeVisible();
    await expect(button).toBeFocused();
    await button.click();
    await index.getByRole("link", { name: "Segunda parte", exact: true }).click();
    await expect(index).toBeHidden();
    await expect(page).toHaveURL(/#segunda-parte/);
    await page.keyboard.press("Escape");
    await expect(article).toHaveCount(0);
  } finally {
    await context.close();
  }
});
