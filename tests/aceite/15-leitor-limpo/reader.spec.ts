import { chooseReaderTheme, chooseReaderFont, chooseReaderAlignment, revealReaderControl } from "../../helpers/reader-controls";
import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

declare global {
  interface Window {
    chrome: {
      runtime: { getURL: (path: string) => string; sendMessage: (message: unknown) => Promise<unknown> };
      action: { getTitle: (details: Record<string, never>) => Promise<string> };
    };
    __conteudoExecutado?: number;
    __handlerExecutado?: number;
    __readerActivationMs?: number;
  }
}

const extensionPath = process.env.MLA_EXTENSION_DIR ?? resolve(".output/chrome-mv3");
const articleUrl = "https://example.test/article";
const otherUrl = "https://example.test/other";
function pdfWithPages(pageCount: number): Buffer {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${Array.from({ length: pageCount }, (_, index) => `${index + 3} 0 R`).join(" ")}] /Count ${pageCount} >>`,
    ...Array.from({ length: pageCount }, () => "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1 1] >>"),
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}
const articleHtml = `<!doctype html><html lang="pt-BR"><head><title>Artigo de teste</title></head><body>
  <nav>Menu removível</nav><main><article><h1>Leitura de teste</h1><p onclick="window.__handlerExecutado = (window.__handlerExecutado ?? 0) + 1">Texto principal para validar a leitura local.</p>
  <h2>Segunda seção</h2><ul><li>Item preservado</li></ul><table><thead><tr><th>Campo</th></tr></thead><tbody><tr><td>Valor</td></tr></tbody></table>
  ${Array.from({ length: 24 }, (_, index) => `<p>Trecho entre seções ${index + 1}: um exemplo claro ajuda a manter a atenção, relacionar os argumentos e acompanhar a leitura com tranquilidade.</p>`).join("")}
  <h2>Ritmo próprio</h2>
  ${Array.from({ length: 24 }, (_, index) => `<p>Parágrafo longo ${index + 1}: conteúdo sintético para validar posição, estimativa e progresso da leitura.</p>`).join("")}
  <script>window.__conteudoExecutado = (window.__conteudoExecutado ?? 0) + 1</script>
  <button onclick="window.__handlerExecutado = (window.__handlerExecutado ?? 0) + 1">Ação hostil</button>
  <a href="javascript:window.__linkExecutado=true">Link hostil</a></article></main>
  <aside>Publicidade removível</aside></body></html>`;

async function openExtension(): Promise<{
  context: BrowserContext;
  page: Page;
  extensionId: string;
  remoteRequests: string[];
}> {
  expect(existsSync(extensionPath), "Build the extension before running acceptance tests").toBe(true);
  const context = await chromium.launchPersistentContext("", {
    headless: true,
    channel: "chromium",
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const extensionId = new URL(worker.url()).host;
  const remoteRequests: string[] = [];
  await context.route(/^https?:\/\//, (route) => {
    const url = route.request().url();
    if (url === articleUrl) return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: articleHtml });
    if (url === otherUrl)
      return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: "<!doctype html><article><h1>Outra aba</h1></article>" });
    remoteRequests.push(url);
    return route.abort();
  });
  const otherTab = await context.newPage();
  await otherTab.goto(otherUrl);
  const page = await context.newPage();
  page.setDefaultTimeout(2000);
  await page.goto(articleUrl);
  return { context, page, extensionId, remoteRequests };
}

async function activate(page: Page) {
  const serviceWorker = page.context().serviceWorkers()[0];
  expect(serviceWorker, "Extension service worker must be running").toBeDefined();
  await serviceWorker!.evaluate(async (url) => {
    const api = (
      globalThis as typeof globalThis & {
        chrome: {
          tabs: { query: (query: Record<string, never>) => Promise<{ id?: number; url?: string }[]> };
          scripting: { executeScript: (options: { target: { tabId: number }; files: string[] }) => Promise<unknown> };
        };
      }
    ).chrome;
    const tabs = await api.tabs.query({});
    const tab = tabs.find((candidate) => candidate.url === url);
    if (!tab?.id) throw new Error(`Target tab not found among ${tabs.map(({ url: tabUrl }) => tabUrl).join(", ")}`);
    await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/reader.js"] });
  }, page.url());
  await expect(page.getByRole("article", { name: "Artigo de teste" })).toBeVisible();
}

async function startActivationTimer(page: Page) {
  await page.evaluate(() => {
    const startedAt = performance.now();
    const findVisibleReader = () =>
      [...document.querySelectorAll("*")]
        .map((host) => host.shadowRoot?.querySelector("article, [role='article']"))
        .find((article) => article && article.getClientRects().length > 0);
    const observer = new MutationObserver(() => {
      if (findVisibleReader()) {
        window.__readerActivationMs = performance.now() - startedAt;
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
  });
}

// oxfmt-ignore
test("RN-0001 CA-01 ativa e preserva a estrutura do artigo", async () => {
  const { context, page } = await openExtension();
  try {
    const returnFocus = page.getByRole("button", { name: "Ação hostil" });
    await returnFocus.focus();
    await startActivationTimer(page);
    await activate(page);
    await expect.poll(() => page.evaluate(() => window.__readerActivationMs)).toBeDefined();
    expect(await page.evaluate(() => window.__readerActivationMs)).toBeLessThan(300);
    await expect(page.getByRole("heading", { name: "Leitura de teste" })).toBeVisible();
    await expect(page.getByRole("article", { name: "Artigo de teste" }).getByText("Item preservado")).toBeVisible();
    await expect(page.getByRole("table")).toContainText("Valor");
    await expect(page.getByRole("article", { name: "Artigo de teste" }).getByText("Publicidade removível")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("article", { name: "Artigo de teste" })).toHaveCount(0);
    await expect(returnFocus).toBeFocused();
    expect(
      await page.locator("body").evaluate((body) => ({
        inert: (body as HTMLElement).inert,
        ariaHidden: body.getAttribute("aria-hidden"),
      })),
    ).toEqual({ inert: false, ariaHidden: null });
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${new URL(context.serviceWorkers()[0].url()).host}/popup.html`);
    await expect.poll(async () => popup.evaluate(async () => {
      const api = (globalThis as typeof globalThis & { chrome: Window["chrome"] }).chrome;
      return api.runtime.sendMessage({ type: "GET_CONTEXT_MENU_STATUS" });
    })).toBe(true);
    const manifest = await popup.evaluate(async () => {
      const api = (globalThis as typeof globalThis & { chrome: Window["chrome"] }).chrome;
      const response = await fetch(api.runtime.getURL("manifest.json"));
      return response.json();
    });
    expect(manifest.commands["activate-reader"].suggested_key.default).toBe("Alt+Shift+R");
    await page.bringToFront();
    await popup.getByRole("button", { name: "Ativar modo de leitura" }).click();
    await expect(page.getByRole("article", { name: "Artigo de teste" })).toBeVisible();
    await expect(context.pages()[0].locator("[data-leitor-limpo-host='true']")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

// oxfmt-ignore
test("RN-0001 CA-02 neutraliza conteúdo hostil", async () => {
  const { context, page, remoteRequests } = await openExtension();
  try {
    await expect.poll(() => page.evaluate(() => window.__conteudoExecutado)).toBe(1);
    await activate(page);
    const beforeHostileClick = await page.evaluate(() => window.__handlerExecutado ?? 0);
    await page.getByRole("article", { name: "Artigo de teste" }).getByText("Texto principal para validar a leitura local.").click();
    const unsafeNodes = await page.locator("[data-leitor-limpo-host='true']").evaluate((host) => {
      const article = host.shadowRoot?.querySelector("article");
      return {
        scripts: article?.querySelectorAll("script").length ?? 0,
        handlers: [...(article?.querySelectorAll("*") ?? [])].filter((element) =>
          [...element.attributes].some((attribute) => attribute.name.toLowerCase().startsWith("on")),
        ).length,
        javascriptLinks: [...(article?.querySelectorAll("a") ?? [])].filter((link) => link.protocol === "javascript:").length,
      };
    });
    expect(unsafeNodes).toEqual({ scripts: 0, handlers: 0, javascriptLinks: 0 });
    await expect.poll(() => page.evaluate(() => window.__conteudoExecutado)).toBe(1);
    expect(await page.evaluate(() => window.__handlerExecutado ?? 0)).toBe(beforeHostileClick);
    expect(remoteRequests).toEqual([]);
  } finally {
    await context.close();
  }
});

// oxfmt-ignore
test("RN-0002 CA-03 aplica e persiste controles locais", async () => {
  const { context, page, extensionId } = await openExtension();
  try {
    await activate(page);
    await chooseReaderTheme(page, "Sépia");
    await chooseReaderTheme(page, "Escuro");
    await expect(page.getByRole("article")).toHaveCSS("background-color", "rgb(30, 31, 34)");
    await chooseReaderTheme(page, "Preto");
    await expect(page.getByRole("article")).toHaveCSS("background-color", "rgb(0, 0, 0)");
    await chooseReaderTheme(page, "Branco");
    await expect(page.getByRole("article")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await chooseReaderTheme(page, "Sépia");
    for (const family of ["Literata", "Atkinson Hyperlegible Next", "Lexend"]) {
      await chooseReaderFont(page, family);
      await expect(page.getByRole("article")).toHaveCSS("font-family", new RegExp(family));
    }
    const fontPage = await context.newPage();
    await fontPage.goto(`chrome-extension://${extensionId}/popup.html`);
    const fonts = [
      ["Literata", "fonts/literata-latin.woff2"],
      ["Atkinson Hyperlegible Next", "fonts/atkinson-hyperlegible-next-latin.woff2"],
      ["Lexend", "fonts/lexend-latin.woff2"],
    ];
    for (const [family, path] of fonts) {
      const status = await fontPage.evaluate(async ({ family, path }) => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Font asset unavailable: ${path}`);
        const face = new FontFace(family, await response.arrayBuffer());
        await face.load();
        return face.status;
      }, { family, path });
      expect(status).toBe("loaded");
    }
    await fontPage.close();
    for (let step = 0; step < 20; step += 1) await page.getByRole("button", { name: "Diminuir fonte" }).click();
    await expect(page.getByRole("article")).toHaveCSS("font-size", "14px");
    for (let step = 0; step < 20; step += 1) await page.getByRole("button", { name: "Aumentar fonte" }).click();
    await expect(page.getByRole("article")).toHaveAttribute("data-theme", "sepia");
    await expect(page.getByRole("article")).toHaveCSS("font-size", "32px");
    await expect(page.getByRole("article")).toHaveCSS("font-family", /Lexend/);
    await expect(page.locator('[data-control="theme"] [data-choice="sepia"]')).toHaveCSS("border-radius", "14px");
    await expect(page.locator('select[aria-label="Fonte"]')).toHaveCSS("font-family", /system-ui/);
    await expect.poll(() => page.evaluate(() => document.fonts.check('20px "Lexend"'))).toBe(true);
    for (const name of ["Largura do texto", "Entrelinha", "Velocidade da rolagem"]) {
      await revealReaderControl(page, page.getByRole("slider", { name }));
      expect(await page.getByRole("slider", { name }).evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("button", { name: "Índice" }).click();
    for (const name of ["Leitura de teste", "Segunda seção", "Ritmo próprio"]) {
      expect(await page.getByRole("link", { name }).evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("button", { name: "Índice" }).click();
    const article = page.getByRole("article");
    const width = page.getByRole("slider", { name: "Largura do texto" });
    await revealReaderControl(page, width);
    await width.focus();
    await width.press("Home");
    const initialWidth = await article.evaluate((element) => getComputedStyle(element).maxWidth);
    await width.press("End");
    const appliedWidth = await article.evaluate((element) => getComputedStyle(element).maxWidth);
    expect(appliedWidth).not.toBe(initialWidth);
    const initialLineHeight = await article.evaluate((element) => getComputedStyle(element).lineHeight);
    const lineHeight = page.getByRole("slider", { name: "Entrelinha" });
    await revealReaderControl(page, lineHeight);
    await lineHeight.focus();
    await lineHeight.press("End");
    const appliedLineHeight = await article.evaluate((element) => getComputedStyle(element).lineHeight);
    expect(appliedLineHeight).not.toBe(initialLineHeight);
    await chooseReaderAlignment(page, "Justificado");
    await expect(page.getByRole("article")).toHaveCSS("text-align", "justify");
    const widthValue = await width.inputValue();
    const lineHeightValue = await lineHeight.inputValue();
    await article.evaluate((element) => element.scrollIntoView({ block: "center" }));
    const articlePosition = await article.evaluate((element) => element.getBoundingClientRect().top);
    await page.getByRole("button", { name: "Aumentar fonte" }).click();
    expect(Math.abs((await article.evaluate((element) => element.getBoundingClientRect().top)) - articlePosition)).toBeLessThanOrEqual(2);
    await page.reload();
    await activate(page);
    await expect(page.getByRole("article")).toHaveAttribute("data-theme", "sepia");
    await expect(page.locator('select[aria-label="Fonte"]')).toHaveValue("Lexend");
    await expect(page.getByRole("article")).toHaveCSS("font-size", "32px");
    await expect(page.getByRole("article")).toHaveCSS("max-width", appliedWidth);
    await expect(page.getByRole("article")).toHaveCSS("line-height", appliedLineHeight);
    await revealReaderControl(page, page.getByRole("slider", { name: "Largura do texto" }));
    await expect(page.getByRole("slider", { name: "Largura do texto" })).toHaveValue(widthValue);
    await expect(page.getByRole("slider", { name: "Entrelinha" })).toHaveValue(lineHeightValue);
    await expect(page.locator('select[aria-label="Alinhamento do texto"]')).toHaveValue("justify");
  } finally {
    await context.close();
  }
});

// oxfmt-ignore
test("RN-0002 CA-04 navega pelo índice e mostra o tempo restante", async () => {
  const { context, page } = await openExtension();
  try {
    await activate(page);
    await page.getByRole("button", { name: "Índice" }).click();
    await page.getByRole("link", { name: "Segunda seção" }).click();
    await expect(page).toHaveURL(/#segunda-secao/);
    await revealReaderControl(page, page.getByText(/min de leitura/));
    await expect(page.getByText(/min de leitura/)).toBeVisible();
    const progress = page.getByRole("progressbar", { name: "Progresso da leitura" });
    await expect(progress).toBeVisible();
    const remaining = page.getByText(/restam? \d+ min/i);
    await expect(remaining).toBeVisible();
    const initialRemaining = await remaining.textContent();
    await page.getByRole("link", { name: "Ritmo próprio" }).click();
    await expect(page).toHaveURL(/#ritmo-proprio/);
    await revealReaderControl(page, remaining);
    expect(Number(await progress.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
    await expect(remaining).not.toHaveText(initialRemaining ?? "");
    await page.locator("[data-leitor-limpo-host='true'] .veil").evaluate((element) => element.scrollTo(0, element.scrollHeight));
    await expect(progress).toHaveAttribute("aria-valuenow", "100");
    await expect(remaining).toHaveText("restam 0 min");
  } finally {
    await context.close();
  }
});

// oxfmt-ignore
test("RN-0002 CA-05 inicia, pausa e ajusta a rolagem automática", async () => {
  const { context, page } = await openExtension();
  try {
    await activate(page);
    await revealReaderControl(page, page.getByRole("button", { name: "Iniciar rolagem" }));
    await page.getByRole("button", { name: "Iniciar rolagem" }).click();
    await expect(page.getByRole("button", { name: "Pausar rolagem" })).toHaveAttribute("aria-pressed", "true");
    const speed = page.getByRole("slider", { name: "Velocidade da rolagem" });
    const initialSpeed = await speed.getAttribute("aria-valuenow");
    await speed.focus();
    await speed.press("End");
    expect(await speed.getAttribute("aria-valuenow")).not.toBe(initialSpeed);
    await page.getByRole("button", { name: "Pausar rolagem" }).click();
    await expect(page.getByRole("button", { name: "Iniciar rolagem" })).toHaveAttribute("aria-pressed", "false");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const readingPosition = await page.getByRole("heading", { name: "Ritmo próprio" }).evaluate((element) => element.getBoundingClientRect().top);
    await revealReaderControl(page, page.getByRole("button", { name: "Iniciar rolagem" }));
    await page.getByRole("button", { name: "Iniciar rolagem" }).click();
    await page.waitForTimeout(250);
    await expect(page.getByRole("button", { name: "Iniciar rolagem" })).toHaveAttribute("aria-pressed", "false");
    expect(await page.getByRole("heading", { name: "Ritmo próprio" }).evaluate((element) => element.getBoundingClientRect().top)).toBe(readingPosition);
  } finally {
    await context.close();
  }
});

// oxfmt-ignore
test("RN-0003 CA-06 abre PDF local com texto selecionável", async () => {
  const { context, page, extensionId } = await openExtension();
  try {
    await page.goto(`chrome-extension://${extensionId}/pdf.html`);
    const chooser = page.waitForEvent("filechooser");
    await revealReaderControl(page, page.getByRole("button", { name: "Abrir PDF local" }));
    await page.getByRole("button", { name: "Abrir PDF local" }).click();
    await (await chooser).setFiles(resolve("tests/fixtures/sample.pdf"));
    await expect(page.getByRole("article")).toContainText("PDF de teste");
    await expect(page.getByRole("button", { name: "Fechar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Escolher tema", exact: true })).toBeVisible();
    const oversizedChooser = page.waitForEvent("filechooser");
    await revealReaderControl(page, page.getByRole("button", { name: "Abrir PDF local" }));
    await page.getByRole("button", { name: "Abrir PDF local" }).click();
    await (await oversizedChooser).setFiles({ name: "1001-pages.pdf", mimeType: "application/pdf", buffer: pdfWithPages(1001) });
    await expect(page.getByRole("status")).toContainText("limite de 1000 páginas");
    const scannedChooser = page.waitForEvent("filechooser");
    await revealReaderControl(page, page.getByRole("button", { name: "Abrir PDF local" }));
    await page.getByRole("button", { name: "Abrir PDF local" }).click();
    await (await scannedChooser).setFiles(resolve("tests/fixtures/scanned.pdf"));
    await expect(page.getByRole("status")).toContainText(/sem camada de texto/i);
  } finally {
    await context.close();
  }
});

// oxfmt-ignore
test("RN-0003 CA-07 pede permissão específica para ativação automática", async () => {
  const { context, page, extensionId } = await openExtension();
  try {
    // Chrome headless cannot accept its native host-permission prompt; keep this test focused on the exact origin requested and revoked by the UI.
    await page.addInitScript(() => {
      const granted = new Set<string>();
      Object.defineProperty(globalThis, "__mlaTestPermissions", {
        configurable: true,
        value: {
          request: async ({ origins }: { origins: string[] }) => { origins.forEach((origin) => granted.add(origin)); sessionStorage.setItem("test-permissions", JSON.stringify([...granted])); return true; },
          contains: async ({ origins }: { origins: string[] }) => origins.every((origin) => granted.has(origin)),
          remove: async ({ origins }: { origins: string[] }) => { origins.forEach((origin) => granted.delete(origin)); sessionStorage.setItem("test-permissions", JSON.stringify([...granted])); return true; },
        },
      });
    });
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.getByRole("textbox", { name: "Site" }).fill("https://example.test/*");
    await page.getByRole("button", { name: "Adicionar site automático" }).click();
    await expect(page.getByText("https://example.test/*")).toBeVisible();
    const originsAfterAdd = await page.evaluate(() => JSON.parse(sessionStorage.getItem("test-permissions") ?? "[]") as string[]);
    expect(originsAfterAdd).toContain("https://example.test/*");
    const hostPage = context.pages().find((candidate) => candidate.url().startsWith("https://example.test/"));
    expect(await hostPage?.evaluate(() => location.hostname)).toBe("example.test");
    await expect(page.getByRole("button", { name: /Remover.*example\.test/i })).toBeVisible();
    await page.getByRole("button", { name: /Remover.*example\.test/i }).click();
    await expect(page.getByText("https://example.test/*")).toHaveCount(0);
    const originsAfterRemove = await page.evaluate(() => JSON.parse(sessionStorage.getItem("test-permissions") ?? "[]") as string[]);
    expect(originsAfterRemove).not.toContain("https://example.test/*");
  } finally {
    await context.close();
  }
});

// oxfmt-ignore
test("RN-0004 CA-08 apresenta a interface nos três idiomas", async () => {
  const { context, page, extensionId } = await openExtension();
  try {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    const language = page.getByRole("combobox", { name: "Idioma" });
    for (const [value, label, saveLabel, actionTitle] of [
      ["pt-BR", "Preferências", "Salvar preferências", "Abrir Leitor Limpo"],
      ["en", "Settings", "Save preferences", "Open Leitor Limpo"],
      ["es", "Preferencias", "Guardar preferencias", "Abrir Leitor Limpo"],
    ]) {
      await language.selectOption(value);
      await expect(page.getByRole("heading", { name: label })).toBeVisible();
      await page.getByRole("button", { name: saveLabel }).click();
      const worker = context.serviceWorkers()[0]!;
      await expect
        .poll(() => worker.evaluate(() => (globalThis as typeof globalThis & { chrome: Window["chrome"] }).chrome.action.getTitle({})))
        .toBe(actionTitle);
    }
    const localization = await page.evaluate(async () => {
      const runtime = (globalThis as typeof globalThis & { chrome: Window["chrome"] }).chrome.runtime;
      const response = await fetch(runtime.getURL("_locales/en/messages.json"));
      return { manifest: await (await fetch(runtime.getURL("manifest.json"))).json(), english: await response.json() };
    });
    expect(localization.manifest.default_locale).toBe("pt_BR");
    expect(localization.manifest.commands["activate-reader"].description).toBe("__MSG_activateReaderCommand__");
    expect(localization.english.activateReaderCommand.message).toBe("Open or close reader mode");
  } finally {
    await context.close();
  }
});

// oxfmt-ignore
test("RN-0004 CA-09 carrega como extensão local sem backend", async () => {
  const { context, page, extensionId, remoteRequests } = await openExtension();
  try {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await expect(page.getByRole("heading", { name: "Leitor Limpo" })).toBeVisible();
    await page.getByRole("button", { name: "Salvar preferências" }).click();
    expect(remoteRequests).toEqual([]);
  } finally {
    await context.close();
  }
});
