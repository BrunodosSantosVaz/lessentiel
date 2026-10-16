import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

const url = "https://reading.test/editorial";
const paragraph = "Uma leitura leve preserva as ideias, o contexto e a estrutura de cada texto jornalístico. ".repeat(14);
async function open() {
  const path = resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    viewport: { width: 2400, height: 900 },
    args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`],
  });
  const imageRequests: string[] = [];
  await context.route(/^https?:\/\//, async (route) => {
    if (route.request().url() !== url) {
      imageRequests.push(route.request().url());
      await route.abort();
      return;
    }
    await route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><title>Jornal de leitura</title><article>
      <h1>Jornal de leitura</h1><p>${paragraph}</p><h2>Primeira seção</h2><p>${paragraph}</p>
      <h3>Contexto da notícia</h3><p>${paragraph}</p><h2>Segunda seção</h2><p>${paragraph}</p>
      <blockquote><p>Uma citação deve manter sua identidade no texto.</p><cite>Autoria fictícia</cite></blockquote>
      <p>O jornal destaca <q>um trecho citado</q>, com <strong>ênfase</strong> e <em>itálico</em>.</p>
      <figure><img src="/editorial.jpg" alt="Paisagem da reportagem" width="800" height="400" onerror="window.unsafeImage=true"/><figcaption>Legenda editorial</figcaption></figure>
      <div data-ad-slot="banner"><img src="/advertisement.jpg" alt="Publicidade" width="800" height="400"/></div>
      <img src="https://doubleclick.net/tracking.jpg" alt="Rastreamento" width="1" height="1"/>
      <p>${paragraph}</p><ul><li>Primeiro item</li><li>Segundo item</li></ul>
      <table><caption>Dados da reportagem</caption><thead><tr><th>Período</th><th>Leitores</th></tr></thead><tbody><tr><td>Hoje</td><td>100</td></tr></tbody></table>
      <pre><code>const reading = true;</code></pre><p>${paragraph}</p></article>`,
    });
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const page = await context.newPage();
  await page.goto(url);
  const activate = () =>
    worker.evaluate(async (url) => {
      const api = (globalThis as any).chrome;
      const tab = (await api.tabs.query({})).find((tab: any) => tab.url === url);
      await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/reader.js"] });
    }, url);
  await activate();
  await expect(page.locator("[data-leitor-limpo-host] article")).toBeVisible();
  return { context, page, worker, imageRequests, activate };
}

test("#38 RN-0002 opções diretas sem setas; menus somente em grupos compactados e abaixo da barra", async () => {
  const { context, page } = await open();
  try {
    for (const name of ["Escolher tema", "Escolher fonte", "Escolher alinhamento"]) await expect(page.getByRole("button", { name, exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Fonte Lexend", exact: true })).toBeVisible();
    await page.setViewportSize({ width: 680, height: 900 });
    const trigger = page.locator(".toolbar-line .compact .choice-trigger").first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    expect((await menu.boundingBox())!.y).toBeGreaterThanOrEqual((await trigger.boundingBox())!.y + (await trigger.boundingBox())!.height);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await page.setViewportSize({ width: 2400, height: 900 });
    await expect(page.locator(".toolbar-line .choice-trigger:visible")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("#38 RN-0002 tamanho segue − Aa 100% + e preserva limites e preferência", async () => {
  const { context, page, worker } = await open();
  try {
    const size = page.locator('[data-control="size"]');
    await expect(size.locator(".font-size")).toHaveText("100%");
    await expect(size).toHaveText(/−\s*Aa\s*100%\s*\+/);
    await size.getByRole("button", { name: "Aumentar fonte", exact: true }).click();
    await expect(size.locator(".font-size")).toHaveText("110%");
    await expect(page.getByRole("article")).toHaveCSS("font-size", "22px");
    await expect
      .poll(() => worker.evaluate(async () => (await (globalThis as any).chrome.storage.local.get("readerPreferences")).readerPreferences.fontSize))
      .toBe(22);
  } finally {
    await context.close();
  }
});

test("#38 RN-0002 índice representa títulos e subtítulos com listas aninhadas", async () => {
  const { context, page } = await open();
  try {
    await page.getByRole("button", { name: "Índice", exact: true }).click();
    const index = page.getByRole("navigation", { name: "Índice do artigo", exact: true });
    const title = index
      .locator("li")
      .filter({ has: page.getByRole("link", { name: "Jornal de leitura", exact: true }) })
      .first();
    await expect(title.locator(":scope > ol > li > a")).toHaveText(["Primeira seção", "Segunda seção"]);
    await expect(index.locator("ol ol ol > li > a")).toHaveText(["Contexto da notícia"]);
    await index.getByRole("link", { name: "Segunda seção", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Segunda seção", exact: true })).toBeInViewport();
  } finally {
    await context.close();
  }
});

test("#38 RN-0001 imagens editoriais só carregam ao ativar e publicidade continua excluída", async () => {
  const { context, page, imageRequests, worker, activate } = await open();
  try {
    const article = page.getByRole("article");
    const image = article.getByAltText("Paisagem da reportagem");
    await expect(image).toBeHidden();
    await expect(image).not.toHaveAttribute("src", /./);
    const toggle = page.getByRole("button", { name: "Exibir imagens", exact: true });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    imageRequests.length = 0;
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", "https://reading.test/editorial.jpg");
    await expect(image).not.toHaveAttribute("onerror", /./);
    await expect.poll(() => imageRequests).toEqual(["https://reading.test/editorial.jpg"]);
    await expect(article.getByAltText("Publicidade")).toHaveCount(0);
    await expect(article.getByAltText("Rastreamento")).toHaveCount(0);
    await expect
      .poll(() => worker.evaluate(async () => (await (globalThis as any).chrome.storage.local.get("readerPreferences")).readerPreferences.showImages))
      .toBe(true);
    await toggle.click();
    await expect(image).toBeHidden();
    await expect(image).not.toHaveAttribute("src", /./);
    await page.reload();
    await activate();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  } finally {
    await context.close();
  }
});

test("#38 RN-0001 citações e HTML editorial preservam semântica, ritmo e uma coluna", async () => {
  const { context, page } = await open();
  try {
    const article = page.getByRole("article");
    await expect(article.locator("blockquote")).toContainText("Uma citação deve manter sua identidade");
    await expect(article.locator("blockquote")).toHaveCSS("border-left-style", "solid");
    await expect(article.locator("blockquote")).toHaveCSS("font-style", "italic");
    for (const tag of ["q", "cite", "strong", "em", "ul", "table", "caption", "pre", "code"]) await expect(article.locator(tag).first()).toBeVisible();
    for (const width of [2400, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(article).toHaveCSS("column-count", "1");
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  } finally {
    await context.close();
  }
});

test("#38 RN-0004 popup nativo mantém largura e botões inteiros", async () => {
  const { context, worker } = await open();
  try {
    const popupPromise = context.waitForEvent("page");
    await worker.evaluate(() => (globalThis as any).chrome.action.openPopup());
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    await expect(popup.getByRole("button", { name: "Ativar modo de leitura", exact: true })).toBeInViewport();
    await expect(popup.getByRole("link", { name: "Preferências", exact: true })).toBeInViewport();
    const dimensions = await popup.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      height: innerHeight,
      total: document.documentElement.scrollHeight,
    }));
    expect(dimensions.width).toBeGreaterThanOrEqual(320);
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
    expect(dimensions.total).toBeLessThanOrEqual(dimensions.height);
    await popup.screenshot({ path: "test-results/popup-native.png" });
  } finally {
    await context.close();
  }
});
