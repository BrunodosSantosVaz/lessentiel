import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

async function open(width = 1920) {
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

test("#34 RN-0002 RN-0005 barra permanece em uma linha e distribui controles sem perda ao redimensionar", async () => {
  const { context, page } = await open();
  try {
    for (const width of [1920, 1440, 1280, 1024, 768, 360, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const line = page.locator(".toolbar-line");
      await expect(line).toHaveCSS("flex-wrap", "nowrap");
      await expect.poll(() => page.locator(".veil").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      expect((await page.locator(".toolbar").boundingBox())!.height).toBeLessThanOrEqual(64);
      const box = (await line.boundingBox())!;
      const visible = await line
        .getByRole("button")
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => n.getClientRects().length)
            .map((n) => ({ label: n.getAttribute("aria-label"), y: n.getBoundingClientRect().y, bottom: n.getBoundingClientRect().bottom })),
        );
      expect(visible[0].label).toBe("Índice");
      expect(visible.every((n) => n.y >= box.y && n.bottom <= box.y + box.height)).toBe(true);
      const more = page.getByRole("button", { name: "Mais opções de leitura", exact: true });
      if (await more.isVisible()) {
        await more.click();
        await expect(page.getByRole("region", { name: "Mais opções de leitura", exact: true })).toBeVisible();
      }
      await expect(page.getByRole("button", { name: "Fechar", exact: true })).toBeInViewport();
      if (await more.isVisible()) await page.keyboard.press("Escape");
      await expect(page.getByRole("article")).toBeVisible();
    }
  } finally {
    await context.close();
  }
});

test("#34 RN-0002 RN-0005 amostras visuais têm nomes e expansão por teclado com listas nomeadas", async () => {
  const { context, page } = await open();
  try {
    await expect(page.locator(".theme-preview .theme-swatch")).toHaveCount(5);
    const dark = page.getByRole("button", { name: "Tema Escuro", exact: true });
    await dark.hover();
    await expect(page.getByRole("tooltip")).toHaveText("Escuro");
    const trigger = page.getByRole("button", { name: "Escolher tema", exact: true });
    await trigger.focus();
    await trigger.press("Space");
    const menu = page.getByRole("menu", { name: "Tema", exact: true });
    await expect(menu).toBeVisible();
    await menu.getByRole("menuitemradio", { name: "Preto", exact: true }).click();
    await expect(page.locator(".veil")).toHaveAttribute("data-theme", "black");
    await expect(trigger).toBeFocused();
    for (const font of ["Georgia", "Literata", "Atkinson Hyperlegible Next", "Lexend"]) {
      const preview = page.getByRole("button", { name: `Fonte ${font}`, exact: true });
      await expect(preview).toHaveText("Aa");
      await preview.click();
      await expect(page.getByRole("article")).toHaveCSS("font-family", new RegExp(font));
    }
    await page.getByRole("button", { name: "Alinhar ao centro", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCSS("text-align", "center");
    await page.getByRole("button", { name: "Alinhar à direita", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCSS("text-align", "right");
  } finally {
    await context.close();
  }
});

test("#34 RN-0002 RN-0005 tamanho junto ao rótulo e largura apenas percentual persistem", async () => {
  const { context, page, activate, worker } = await open();
  try {
    await expect(page.locator(".size-heading")).toHaveText(/Tamanho\s*20/);
    await expect(page.getByRole("button", { name: "Aumentar fonte", exact: true })).toHaveCSS("border-top-width", "0px");
    await page.getByRole("button", { name: "Aumentar fonte", exact: true }).click();
    await expect(page.locator(".size-heading")).toHaveText(/Tamanho\s*22/);
    const width = page.getByRole("slider", { name: "Largura do texto", exact: true });
    await width.focus();
    await width.press("Home");
    await expect(width).toHaveAttribute("aria-valuetext", /%/);
    await expect(page.locator(".width-value")).toHaveText("30%");
    await expect
      .poll(() => worker.evaluate(async () => (await (globalThis as any).chrome.storage.local.get("readerPreferences")).readerPreferences.widthPercent))
      .toBe(30);
    await page.reload();
    await activate();
    await expect(page.locator(".width-value")).toHaveText("30%");
    await expect(page.getByRole("article")).toHaveCSS("font-size", "22px");
    await width.focus();
    await width.press("End");
    await expect(page.getByRole("article")).toHaveCSS("max-width", "100%");
  } finally {
    await context.close();
  }
});

test("#34 RN-0002 RN-0005 menu responsivo contém sliders e rolagem, Escape devolve foco", async () => {
  const { context, page } = await open(360);
  try {
    const more = page.getByRole("button", { name: "Mais opções de leitura", exact: true });
    await more.click();
    const panel = page.getByRole("region", { name: "Mais opções de leitura", exact: true });
    for (const name of ["Largura do texto", "Entrelinha", "Velocidade da rolagem"])
      await expect(panel.getByRole("slider", { name, exact: true })).toBeVisible();
    await panel.getByRole("button", { name: "Iniciar rolagem", exact: true }).click();
    await expect(panel.getByRole("button", { name: "Pausar rolagem", exact: true })).toHaveAttribute("aria-pressed", "true");
    await panel.getByRole("button", { name: "Pausar rolagem", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(more).toBeFocused();
    await expect(page.getByRole("article")).toBeVisible();
    await page.getByRole("button", { name: "Escolher fonte", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Lexend", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCSS("font-family", /Lexend/);
    await page.getByRole("button", { name: "Escolher alinhamento", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Centralizado", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCSS("text-align", "center");
  } finally {
    await context.close();
  }
});

test("#34 RN-0002 RN-0005 impressão exclui página e controles e restaura a apresentação ao fechar", async () => {
  const { context, page, activate } = await open();
  try {
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    const originalStyle = await page.locator("body").getAttribute("style");
    await activate();
    await expect(page.getByRole("button", { name: "Imprimir artigo", exact: true })).toBeVisible();
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("body")).toHaveCSS("display", "none");
    await expect(page.locator(".toolbar")).toBeHidden();
    await expect(page.locator("[data-leitor-limpo-host] article")).toBeVisible();
    await page.emulateMedia({ media: "screen" });
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    expect(await page.locator("body").getAttribute("style")).toBe(originalStyle);
    await expect(page.locator("body")).not.toHaveCSS("display", "none");
  } finally {
    await context.close();
  }
});

test("#34 RN-0002 RN-0005 migra largura antiga em pixels sem perder fonte e alinhamento", async () => {
  const { context, page, activate, worker } = await open();
  try {
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await worker.evaluate(() =>
      (globalThis as any).chrome.storage.local.set({ readerPreferences: { width: 760, widthMode: "custom", font: "Lexend", alignment: "justify" } }),
    );
    await activate();
    const article = page.getByRole("article");
    await expect(article).toHaveCSS("font-family", /Lexend/);
    await expect(article).toHaveCSS("text-align", "justify");
    expect(Math.abs((await article.boundingBox())!.width - 760)).toBeLessThanOrEqual(50);
    await expect(page.locator(".width-value")).toHaveText(/^\d+%$/);
    await expect
      .poll(() => worker.evaluate(async () => (await (globalThis as any).chrome.storage.local.get("readerPreferences")).readerPreferences.widthPercent))
      .toBeGreaterThan(0);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await worker.evaluate(() => (globalThis as any).chrome.storage.local.set({ readerPreferences: { width: 1000, widthMode: "full" } }));
    await activate();
    await expect(article).toHaveCSS("max-width", "100%");
    await expect(page.locator(".width-value")).toHaveText("100%");
  } finally {
    await context.close();
  }
});

test("#34 RN-0002 RN-0005 controle com foco migra para Mais sem perder ajuste ao reduzir a janela", async () => {
  const { context, page } = await open();
  try {
    const width = page.getByRole("slider", { name: "Largura do texto", exact: true });
    await width.focus();
    await width.press("Home");
    await width.press("ArrowRight");
    await page.setViewportSize({ width: 360, height: 900 });
    const more = page.getByRole("button", { name: "Mais opções de leitura", exact: true });
    await expect(more).toBeFocused();
    await more.press("Space");
    await expect(width).toHaveValue("35");
    await width.focus();
    await width.press("End");
    await expect(page.getByRole("article")).toHaveCSS("max-width", "100%");
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await expect(page.getByRole("article")).toBeVisible();
  } finally {
    await context.close();
  }
});

test("#34 RN-0002 RN-0005 todos os controles do painel continuam alcançáveis por Tab após reduzir a janela", async () => {
  const { context, page } = await open();
  try {
    await page.setViewportSize({ width: 360, height: 900 });
    const more = page.getByRole("button", { name: "Mais opções de leitura", exact: true });
    await more.focus();
    await more.press("Space");
    const controls = page.getByRole("region", { name: "Mais opções de leitura", exact: true }).locator("button:visible, select:visible, input:visible");
    expect(await controls.count()).toBeGreaterThanOrEqual(7);
    for (const control of await controls.all()) {
      await expect(control).toBeFocused();
      await page.keyboard.press("Tab");
    }
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
  } finally {
    await context.close();
  }
});
