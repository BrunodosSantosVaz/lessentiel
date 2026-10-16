import { chooseReaderTheme } from "../helpers/reader-controls";
import { chromium, expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";

const pageUrl = "https://reading.test/article";
const paragraph = "Uma leitura tranquila permite acompanhar as ideias, compreender os detalhes e escolher o próprio ritmo. ";
const article = `<article><h1>Artigo em componente</h1><p>${paragraph.repeat(8)}</p><h2>Uma segunda seção</h2><p>${paragraph.repeat(12)}</p></article>`;

async function open(html: string, width = 1440) {
  const extensionPath = resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    viewport: { width, height: 900 },
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  await context.route(/^https?:\/\//, (route) =>
    route.request().url() === pageUrl ? route.fulfill({ contentType: "text/html; charset=utf-8", body: html }) : route.abort(),
  );
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const page = await context.newPage();
  await page.goto(pageUrl);
  const activate = () =>
    worker.evaluate(async (url) => {
      const api = (globalThis as any).chrome;
      const tabs = await api.tabs.query({});
      const tab = tabs.find((item: { url?: string }) => item.url === url);
      await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/reader.js"] });
    }, pageUrl);
  return { context, page, activate };
}

async function readerVisible(page: Page) {
  await expect(page.locator("[data-leitor-limpo-host='true'] article")).toBeVisible();
}

test("#47 RN-0001 preserva parágrafos irmãos de um article de cabeçalho vazio", async () => {
  const html = `<!doctype html><title>Notícia de demonstração</title><main class="mc-article-body">
    <article class="content-head"><h1>Notícia de demonstração</h1></article>
    ${Array.from({ length: 6 }, (_, index) => `<p class="content-text__container">Parágrafo ${index + 1}. ${paragraph.repeat(5)}</p>`).join("")}
    </main>`;
  const { context, page, activate } = await open(html);
  try {
    await activate();
    const reader = page.locator("[data-leitor-limpo-host='true'] article");
    await expect(reader).toContainText("Parágrafo 1.");
    await expect(reader).toContainText("Parágrafo 6.");
    await expect(reader.locator("p")).toHaveCount(6);
    await expect(reader.locator("article")).toHaveCount(0);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page.locator("main > p")).toHaveCount(6);
  } finally {
    await context.close();
  }
});

test("#26 RN-0001 extrai artigo em Shadow DOM aninhado, preserva slots e restaura a página", async () => {
  const html = `<!doctype html><title>Artigo em componente</title><article>; ; ; <button>Continuar lendo</button></article><news-shell></news-shell>
    <script>
      const shell = document.querySelector('news-shell').attachShadow({mode:'open'});
      shell.innerHTML = '<cp-article></cp-article>';
      const host = shell.querySelector('cp-article');
      const root = host.attachShadow({mode:'open'});
      root.innerHTML = ${JSON.stringify(article.replace("</article>", '<slot name="extra"></slot></article>'))};
      const extra = document.createElement('p'); extra.slot = 'extra'; extra.textContent = 'Trecho distribuído pelo slot.'; host.append(extra);
      window.originalArticleRoot = root;
    </script>`;
  const { context, page, activate } = await open(html);
  try {
    await activate();
    await readerVisible(page);
    const reader = page.locator("[data-leitor-limpo-host='true'] article");
    await expect(reader).toContainText(paragraph.trim());
    await expect(reader.getByText("Trecho distribuído pelo slot.", { exact: true })).toHaveCount(1);
    await expect(reader).not.toContainText("Continuar lendo");
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    expect(
      await page.evaluate(
        () => document.querySelector("news-shell")?.shadowRoot?.querySelector("cp-article")?.shadowRoot === (window as any).originalArticleRoot,
      ),
    ).toBe(true);
    await activate();
    await readerVisible(page);
    await activate();
    await expect(page.locator("[data-leitor-limpo-host='true'] article")).toHaveCount(0);
    expect(await page.locator("body").evaluate((body) => (body as HTMLElement).inert)).toBe(false);
  } finally {
    await context.close();
  }
});

test("#26 RN-0001 rejeita fragmento sem artigo em vez de exibir pontuação e controles", async () => {
  const { context, page, activate } = await open("<!doctype html><title>Sem artigo</title><article>; ; ; <button>Continuar lendo</button></article>");
  try {
    await activate();
    await expect(page.locator("[data-leitor-limpo-host='true'] article")).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("Não foi possível identificar");
  } finally {
    await context.close();
  }
});

test("#26 RN-0001 mantém o título editorial dos metadados", async () => {
  const { context, page, activate } = await open(
    `<!doctype html><title>Título genérico do portal</title><meta property="og:title" content="Título editorial específico"><meta name="author" content="Autora fictícia">${article}`,
  );
  try {
    await activate();
    await readerVisible(page);
    await expect(page.locator("[data-leitor-limpo-host='true'] article")).toHaveAttribute("aria-label", "Título editorial específico");
  } finally {
    await context.close();
  }
});

test("#26 RN-0001 mantém metadados JSON-LD sem executar scripts", async () => {
  const metadata = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: "Título editorial em JSON-LD",
    author: { "@type": "Person", name: "Autora fictícia" },
  });
  const { context, page, activate } = await open(
    `<!doctype html><title>Título genérico do portal</title><script type="application/ld+json">${metadata}</script>${article}`,
  );
  try {
    await activate();
    await readerVisible(page);
    await expect(page.locator("[data-leitor-limpo-host='true'] article")).toHaveAttribute("aria-label", "Título editorial em JSON-LD");
    await expect(page.locator("[data-leitor-limpo-host='true'] article script")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("#26 RN-0001 recusa cópia acima do limite de caracteres", async () => {
  const { context, page, activate } = await open(
    `<!doctype html><title>Artigo grande</title><article><h1>Artigo grande</h1><p>${"conteúdo local ".repeat(360000)}</p></article>`,
  );
  try {
    await activate();
    await expect(page.locator("[data-leitor-limpo-host='true'] article")).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("Não foi possível identificar");
  } finally {
    await context.close();
  }
});

test("#26 RN-0001 sanitiza o conteúdo vindo do Shadow DOM", async () => {
  const hostile = article.replace(
    "</article>",
    '<p onclick="window.shadowHandlerExecuted=true">Trecho hostil</p><a href="javascript:window.shadowLinkExecuted=true">Link hostil</a><img src="https://outside.test/leak" onerror="window.shadowHandlerExecuted=true"></article>',
  );
  const { context, page, activate } = await open(
    `<!doctype html><title>Artigo seguro</title><news-story></news-story><script>document.querySelector('news-story').attachShadow({mode:'open'}).innerHTML=${JSON.stringify(hostile)};</script>`,
  );
  try {
    await activate();
    await readerVisible(page);
    const reader = page.locator("[data-leitor-limpo-host='true'] article");
    await expect(reader.getByText("Trecho hostil", { exact: true })).not.toHaveAttribute("onclick", /.*/);
    expect(
      await reader.evaluate((node) =>
        [...node.querySelectorAll("*")].some((element) => [...element.attributes].some((attribute) => /^on|^(src|srcset)$/i.test(attribute.name))),
      ),
    ).toBe(false);
    expect(await reader.locator("a").evaluateAll((links) => links.some((link) => link.getAttribute("href")?.startsWith("javascript:")))).toBe(false);
  } finally {
    await context.close();
  }
});

test("#26 RN-0002 barra compacta e tema aplicado à tela inteira", async () => {
  const { context, page, activate } = await open(`<!doctype html><title>Leitura tranquila</title>${article}`);
  try {
    await activate();
    await readerVisible(page);
    const toolbar = page.locator("[data-leitor-limpo-host='true'] .toolbar");
    expect((await toolbar.boundingBox())!.height).toBeLessThanOrEqual(140);
    await chooseReaderTheme(page, "Escuro");
    await expect(page.locator("[data-leitor-limpo-host='true'] .veil")).toHaveCSS("background-color", "rgb(41, 42, 45)");
    await expect(page.locator('[data-control="theme"] [data-choice="dark"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-control="theme"] [data-choice="light"]')).toHaveAttribute("aria-pressed", "false");
  } finally {
    await context.close();
  }
});

test("#26 RN-0002 controles e texto continuam acessíveis em 360 px", async () => {
  const { context, page, activate } = await open(`<!doctype html><title>Leitura tranquila</title>${article}`, 360);
  try {
    await activate();
    await readerVisible(page);
    const veil = page.locator("[data-leitor-limpo-host='true'] .veil");
    expect(await veil.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect((await page.locator("[data-leitor-limpo-host='true'] .toolbar").boundingBox())!.height).toBeLessThanOrEqual(360);
    await expect(page.getByRole("button", { name: "Fechar", exact: true })).toBeInViewport();
    await chooseReaderTheme(page, "Sépia");
    await expect(veil).toHaveCSS("background-color", "rgb(250, 247, 240)");
  } finally {
    await context.close();
  }
});

test("#30 RN-0002 tema automático acompanha o sistema, persiste e respeita escolha manual", async () => {
  const { context, page, activate } = await open(`<!doctype html><title>Leitura tranquila</title>${article}`, 360);
  try {
    await page.emulateMedia({ colorScheme: "dark" });
    await activate();
    await readerVisible(page);
    const automatic = page.locator('[data-control="theme"] [data-choice="auto"]');
    const veil = page.locator("[data-leitor-limpo-host='true'] .veil");
    await chooseReaderTheme(page, "Automático");
    await expect(automatic).toHaveAttribute("aria-pressed", "true");
    await expect(veil).toHaveCSS("background-color", "rgb(41, 42, 45)");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(veil).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await chooseReaderTheme(page, "Preto");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(veil).toHaveCSS("background-color", "rgb(0, 0, 0)");
    await expect(automatic).toHaveAttribute("aria-pressed", "false");
    await chooseReaderTheme(page, "Automático");
    await expect
      .poll(() =>
        context.serviceWorkers()[0]!.evaluate(async () => (await (globalThis as any).chrome.storage.local.get("readerPreferences")).readerPreferences.theme),
      )
      .toBe("auto");
    await page.reload();
    await activate();
    await expect(automatic).toHaveAttribute("aria-pressed", "true");
    await expect(veil).toHaveCSS("background-color", "rgb(41, 42, 45)");
    expect(await veil.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  } finally {
    await context.close();
  }
});
