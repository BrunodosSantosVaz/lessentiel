import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

async function open(width = 2200) {
  const path = resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    viewport: { width, height: 900 },
    args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`],
  });
  const url = "https://reading.test/toolbar";
  await context.route(/^https?:\/\//, (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><title>Leitura tranquila</title><nav>Página original</nav><article><h1>Leitura tranquila</h1><p>${"Conteúdo fictício para testar os controles de leitura com segurança. ".repeat(24)}</p><h2>Próxima seção</h2>${`<p>${"Uma apresentação simples deixa espaço para as ideias. ".repeat(20)}</p>`.repeat(15)}</article>`,
    }),
  );
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const page = await context.newPage();
  await page.goto(url);
  const activate = () =>
    worker.evaluate(async (url) => {
      const api = (globalThis as any).chrome;
      const tab = (await api.tabs.query({})).find((t: any) => t.url === url);
      await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/reader.js"] });
    }, url);
  await activate();
  await expect(page.locator("[data-leitor-limpo-host] article")).toBeVisible();
  return { context, page, activate, worker };
}

test("#36 RN-0005 não recolhe controles enquanto a apresentação normal cabe", async () => {
  const { context, page } = await open();
  try {
    await expect(page.locator(".toolbar-controls .compact")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mais opções de leitura", exact: true })).toBeHidden();
    await expect(page.locator(".overflow-content .control-group")).toHaveCount(0);
    await page.setViewportSize({ width: 360, height: 900 });
    await expect(page.getByRole("button", { name: "Mais opções de leitura", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Mais opções de leitura", exact: true }).focus();
    await page.setViewportSize({ width: 2200, height: 900 });
    await expect(page.getByRole("button", { name: "Mais opções de leitura", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Índice", exact: true })).toBeFocused();
  } finally {
    await context.close();
  }
});

test("#36 RN-0002 fontes de prévia e artigo são renderizadas pelos arquivos reais", async () => {
  const { context, page } = await open();
  try {
    await expect(page.locator("[data-leitor-limpo-host]")).toHaveAttribute("data-fonts", "ready");
    const cdp = await context.newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const actual = new Set<string>();
    for (const family of ["Literata", "Atkinson Hyperlegible Next", "Lexend"]) {
      const preview = page.getByRole("button", { name: `Fonte ${family}`, exact: true });
      await preview.click();
      const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
      const nodes: any[] = [];
      const walk = (node: any) => {
        nodes.push(node);
        for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) walk(child);
      };
      walk(root);
      const node = nodes.find((n) => n.nodeName === "BUTTON" && n.attributes?.includes(`Fonte ${family}`));
      const fonts = await cdp.send("CSS.getPlatformFontsForNode", { nodeId: node.nodeId });
      expect(fonts.fonts.some((f) => f.isCustomFont && f.glyphCount > 0)).toBe(true);
      actual.add(fonts.fonts.map((f) => f.familyName).join(","));
      const article = nodes.find((n) => n.nodeName === "ARTICLE" && n.attributes?.includes("role"));
      const rendered = await cdp.send("CSS.getPlatformFontsForNode", { nodeId: article.children.find((n: any) => n.nodeName === "H1").nodeId });
      expect(rendered.fonts.some((f) => f.isCustomFont && f.glyphCount > 0)).toBe(true);
    }
    expect(actual.size).toBe(3);
  } finally {
    await context.close();
  }
});

test("#36 RN-0002 leitura usa rolagem do navegador e restaura página e posição", async () => {
  const { context, page } = await open();
  try {
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await page.locator("html").evaluate((el) => {
      el.style.setProperty("overflow", "scroll", "important");
      el.style.setProperty("height", "100%", "important");
    });
    await page.locator("body").evaluate((el) => {
      el.style.setProperty("display", "block", "important");
    });
    await page.evaluate(() => window.scrollTo(0, 500));
    const state = await page.evaluate(() => ({
      html: document.documentElement.getAttribute("style"),
      body: document.body.getAttribute("style"),
      y: window.scrollY,
    }));
    const worker = context.serviceWorkers()[0];
    await worker.evaluate(async () => {
      const api = (globalThis as any).chrome;
      const tab = (await api.tabs.query({})).find((t: any) => t.url?.startsWith("https://reading.test/"));
      await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/reader.js"] });
    });
    await expect(page.locator(".veil")).toHaveCSS("position", "static");
    await expect(page.locator("body")).toHaveCSS("display", "none");
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect.poll(() => page.locator(".toolbar").evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    expect(
      await page.evaluate(() => ({ html: document.documentElement.getAttribute("style"), body: document.body.getAttribute("style"), y: window.scrollY })),
    ).toEqual(state);
  } finally {
    await context.close();
  }
});

test("#36 RN-0002 seleção tem sombra discreta e temas suaves", async () => {
  const { context, page } = await open();
  try {
    const sepia = page.getByRole("button", { name: "Tema Sépia", exact: true });
    await sepia.click();
    await expect(page.locator(".veil")).toHaveCSS("background-color", "rgb(250, 247, 240)");
    await expect(sepia.locator(".theme-swatch")).toHaveCSS("outline-style", "none");
    expect(await sepia.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
    await page.getByRole("button", { name: "Tema Escuro", exact: true }).click();
    await expect(page.locator(".veil")).toHaveCSS("background-color", "rgb(41, 42, 45)");
  } finally {
    await context.close();
  }
});

test("#36 RN-0004 popup e preferências têm fluxo único e estado de arquivos locais", async () => {
  const { context, worker } = await open();
  try {
    const id = new URL(worker.url()).host;
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${id}/popup.html`);
    await expect(popup.getByRole("link", { name: "Abrir PDF local", exact: true })).toHaveCount(0);
    await expect(popup.getByRole("link", { name: "Preferências", exact: true })).toBeVisible();
    await popup.goto(`chrome-extension://${id}/options.html`);
    await expect(popup.getByRole("checkbox", { name: "Abrir HTML local automaticamente", exact: true })).toBeVisible();
    await expect(popup.locator("#file-access-status")).not.toHaveText("");
    await popup.setViewportSize({ width: 360, height: 900 });
    expect(await popup.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});

async function openLocal(file: string) {
  const path = resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`, "--allow-file-access-from-files"],
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const id = new URL(worker.url()).host;
  const settings = await context.newPage();
  await settings.goto(`chrome://extensions/?id=${id}`);
  const toggle = settings.locator("#allow-file-access").locator("cr-toggle");
  if ((await toggle.count()) && (await toggle.getAttribute("checked")) === null) await toggle.click();
  const page = await context.newPage();
  await page.goto(new URL(`file://${resolve(file)}`).href);
  return { context, page, worker };
}
test("#36 RN-0001 HTML local entra no leitor sem ativação manual", async () => {
  const { context, page } = await openLocal("tests/fixtures/local-reading.html");
  try {
    await expect(page.getByRole("article")).toContainText("Leitura de arquivo local");
    await expect(page.locator("[data-leitor-limpo-host]")).toHaveCount(1);
  } finally {
    await context.close();
  }
});
test("#47 RN-0003 PDF abre no visualizador nativo e alterna manualmente sem ciclo", async () => {
  const { context, page, worker } = await openLocal("tests/fixtures/sample.pdf");
  try {
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/file:.*sample\.pdf$/);
    await expect(page.locator("[data-leitor-limpo-host]")).toHaveCount(0);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/file:.*sample\.pdf$/);
    const id = new URL(worker.url()).host;
    const controls = await context.newPage();
    await controls.goto(`chrome-extension://${id}/popup.html`);
    const toggle = async () => {
      await page.bringToFront();
      return controls.evaluate(() => (globalThis as any).chrome.runtime.sendMessage({ type: "ACTIVATE_READER" }));
    };
    expect(await toggle()).toBe(true);
    await expect(page.getByRole("article")).toContainText("PDF de teste");
    expect(await toggle()).toBe(true);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/file:.*sample\.pdf$/);
    expect(await toggle()).toBe(true);
    await expect(page.getByRole("article")).toContainText("PDF de teste");
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page).toHaveURL(/file:.*sample\.pdf$/);
    await expect(page.locator("[data-leitor-limpo-host]")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

function formattedPdf(): Buffer {
  const line = (x: number, y: number, text: string, size = 12) => `BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${text}) Tj ET`;
  const stream = [
    line(170, 750, "Leitura em duas colunas", 18),
    line(50, 700, "Inicio da coluna esquerda"),
    line(330, 700, "Inicio da coluna direita"),
    line(50, 684, "continua no mesmo paragrafo."),
    line(330, 684, "continua sem misturar colunas."),
    line(50, 650, "Segundo paragrafo da esquerda"),
    line(330, 650, "Segundo paragrafo da direita"),
    line(50, 634, "encerra o primeiro bloco."),
    line(330, 634, "encerra o segundo bloco."),
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

test("#47 RN-0003 PDF recompõe linhas, parágrafos e ordem das duas colunas", async () => {
  const { context, page, worker } = await open();
  try {
    const id = new URL(worker.url()).host;
    await page.goto(`chrome-extension://${id}/pdf.html`);
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Abrir PDF local", exact: true }).click();
    await (await chooser).setFiles({ name: "colunas.pdf", mimeType: "application/pdf", buffer: formattedPdf() });
    const reader = page.getByRole("article");
    await expect(reader.locator("p")).toHaveText([
      "Leitura em duas colunas",
      "Inicio da coluna esquerda continua no mesmo paragrafo.",
      "Segundo paragrafo da esquerda encerra o primeiro bloco.",
      "Inicio da coluna direita continua sem misturar colunas.",
      "Segundo paragrafo da direita encerra o segundo bloco.",
    ]);
    await expect(reader).toHaveCSS("column-count", "1");
    await expect(reader.locator("p").nth(1)).toHaveCSS("text-indent", "0px");
  } finally {
    await context.close();
  }
});

test("#36 RN-0003 desativar automação local preserva ativação manual", async () => {
  const { context, page, worker } = await openLocal("tests/fixtures/local-reading.html");
  try {
    await expect(page.locator("[data-leitor-limpo-host] article")).toBeVisible();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await worker.evaluate(() => (globalThis as any).chrome.storage.local.set({ automaticLocalFiles: false }));
    await page.reload();
    await expect(page.locator("[data-leitor-limpo-host]")).toHaveCount(0);
    await worker.evaluate(async () => {
      const api = (globalThis as any).chrome;
      const tab = (await api.tabs.query({})).find((tab: any) => tab.url?.startsWith("file:"));
      await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-scripts/reader.js"] });
    });
    await expect(page.locator("[data-leitor-limpo-host] article")).toBeVisible();
  } finally {
    await context.close();
  }
});
test("#36 RN-0003 leitor PDF rejeita fonte remota sem requisitar documento", async () => {
  const { context, worker } = await open();
  try {
    const id = new URL(worker.url()).host;
    const page = await context.newPage();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().startsWith("https://reading.test/private.pdf")) requests.push(request.url());
    });
    await page.goto(`chrome-extension://${id}/pdf.html?source=${encodeURIComponent("https://reading.test/private.pdf")}`);
    await expect(page.getByRole("status")).toContainText("Não foi possível ler este PDF");
    expect(requests).toEqual([]);
  } finally {
    await context.close();
  }
});
