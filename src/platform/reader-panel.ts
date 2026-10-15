import { browser } from "wxt/browser";
import type { ExtractedArticle } from "./extract-article";

const hostSelector = "[data-leitor-limpo-host='true']";
const preferenceKey = "readerPreferences";

type Preferences = {
  language: "pt-BR" | "en" | "es";
  theme: "light" | "sepia" | "dark" | "black";
  font: "Literata" | "Atkinson Hyperlegible Next" | "Lexend";
  fontSize: number;
  width: number;
  lineHeight: number;
  alignment: "left" | "justify";
  speed: number;
};

const defaults: Preferences = {
  language: "pt-BR",
  theme: "light",
  font: "Literata",
  fontSize: 20,
  width: 760,
  lineHeight: 1.65,
  alignment: "left",
  speed: 3,
};

async function loadPreferences(): Promise<Preferences> {
  try {
    const stored = (await browser.storage.local.get(preferenceKey))[preferenceKey] as Partial<Preferences> | undefined;
    const allowedFonts: Preferences["font"][] = ["Literata", "Atkinson Hyperlegible Next", "Lexend"];
    const limit = (value: unknown, fallback: number, minimum: number, maximum: number, step: number) => {
      if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
      return Math.min(maximum, Math.max(minimum, Math.round(value / step) * step));
    };
    return {
      language: ["en", "es"].includes(stored?.language ?? "") ? (stored!.language as "en" | "es") : defaults.language,
      theme: ["light", "sepia", "dark", "black"].includes(stored?.theme ?? "") ? (stored!.theme as Preferences["theme"]) : defaults.theme,
      font: allowedFonts.includes(stored?.font as Preferences["font"]) ? (stored!.font as Preferences["font"]) : defaults.font,
      fontSize: limit(stored?.fontSize, defaults.fontSize, 14, 32, 2),
      width: limit(stored?.width, defaults.width, 560, 1000, 20),
      lineHeight: limit(stored?.lineHeight, defaults.lineHeight, 1.2, 2.2, 0.05),
      alignment: stored?.alignment === "justify" ? "justify" : "left",
      speed: limit(stored?.speed, defaults.speed, 1, 10, 1),
    };
  } catch {
    return { ...defaults };
  }
}

export async function toggleReader(article: ExtractedArticle, onOpenPdf?: (close: () => void) => void): Promise<void> {
  const current = document.querySelector<HTMLElement & { restorePage?: () => void }>(hostSelector);
  if (current) {
    current.restorePage?.();
    current.remove();
    return;
  }

  const preferences = await loadPreferences();
  const ui = {
    "pt-BR": {
      close: "Fechar",
      openPdf: "Abrir PDF local",
      themes: ["Branco", "Sépia", "Escuro", "Preto"],
      theme: "Tema",
      font: "Fonte",
      decrease: "Diminuir fonte",
      increase: "Aumentar fonte",
      width: "Largura do texto",
      line: "Entrelinha",
      align: "Alinhamento do texto",
      left: "À esquerda",
      justify: "Justificado",
      index: "Índice",
      indexLabel: "Índice do artigo",
      start: "Iniciar rolagem",
      pause: "Pausar rolagem",
      speed: "Velocidade da rolagem",
      progress: "Progresso da leitura",
      time: (n: number) => `${n} min de leitura`,
      remaining: (n: number) => `restam ${n} min`,
    },
    en: {
      close: "Close",
      openPdf: "Open local PDF",
      themes: ["White", "Sepia", "Dark", "Black"],
      theme: "Theme",
      font: "Font",
      decrease: "Decrease font size",
      increase: "Increase font size",
      width: "Text width",
      line: "Line spacing",
      align: "Text alignment",
      left: "Left",
      justify: "Justified",
      index: "Contents",
      indexLabel: "Article contents",
      start: "Start scrolling",
      pause: "Pause scrolling",
      speed: "Scroll speed",
      progress: "Reading progress",
      time: (n: number) => `${n} min read`,
      remaining: (n: number) => `${n} min remaining`,
    },
    es: {
      close: "Cerrar",
      openPdf: "Abrir PDF local",
      themes: ["Blanco", "Sepia", "Oscuro", "Negro"],
      theme: "Tema",
      font: "Fuente",
      decrease: "Reducir tamaño",
      increase: "Aumentar tamaño",
      width: "Ancho del texto",
      line: "Interlineado",
      align: "Alineación del texto",
      left: "A la izquierda",
      justify: "Justificado",
      index: "Índice",
      indexLabel: "Índice del artículo",
      start: "Iniciar desplazamiento",
      pause: "Pausar desplazamiento",
      speed: "Velocidad de desplazamiento",
      progress: "Progreso de lectura",
      time: (n: number) => `${n} min de lectura`,
      remaining: (n: number) => `quedan ${n} min`,
    },
  }[preferences.language];
  const host = document.createElement("div") as HTMLElement & { restorePage?: () => void };
  const sourceBody = document.body;
  const previousInert = sourceBody.inert;
  const previousAriaHidden = sourceBody.getAttribute("aria-hidden");
  const restorePage = () => {
    sourceBody.inert = previousInert;
    if (previousAriaHidden === null) sourceBody.removeAttribute("aria-hidden");
    else sourceBody.setAttribute("aria-hidden", previousAriaHidden);
  };
  host.restorePage = restorePage;
  host.dataset.leitorLimpoHost = "true";
  host.setAttribute("aria-label", "Leitor Limpo");
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  const runtime = browser.runtime as typeof browser.runtime & { getURL: (path: string) => string };
  const fontUrl = (file: string) => runtime.getURL(`fonts/${file}`);
  style.textContent = `
    @font-face { font-family: Literata; font-style: normal; font-weight: 400 700; src: url("${fontUrl("literata-latin.woff2")}") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
    @font-face { font-family: Literata; font-style: normal; font-weight: 400 700; src: url("${fontUrl("literata-latin-ext.woff2")}") format("woff2"); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF; }
    @font-face { font-family: "Atkinson Hyperlegible Next"; font-style: normal; font-weight: 400 700; src: url("${fontUrl("atkinson-hyperlegible-next-latin.woff2")}") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
    @font-face { font-family: "Atkinson Hyperlegible Next"; font-style: normal; font-weight: 400 700; src: url("${fontUrl("atkinson-hyperlegible-next-latin-ext.woff2")}") format("woff2"); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF; }
    @font-face { font-family: Lexend; font-style: normal; font-weight: 400 700; src: url("${fontUrl("lexend-latin.woff2")}") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
    @font-face { font-family: Lexend; font-style: normal; font-weight: 400 700; src: url("${fontUrl("lexend-latin-ext.woff2")}") format("woff2"); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF; }
    :host { all: initial; color-scheme: light; font-family: system-ui, sans-serif; }
    .veil { --cor-fundo: #F7F8F6; --cor-superficie: #FFFFFF; --cor-texto: #17332E; --cor-suave: #50635F; --cor-primaria: #075E54; --cor-linha: #65736E; --cor-foco: #174EA6; --fonte-interface: system-ui, sans-serif; --leitura-fundo: #FFFFFF; --leitura-texto: #1A1A1A; --leitura-link: #075E54; --espaco-1: 4px; --espaco-2: 8px; --espaco-3: 12px; --espaco-4: 16px; --espaco-5: 24px; --espaco-6: 32px; --raio-padrao: 14px; --alvo-toque: 44px; --foco: 3px solid var(--cor-foco); position: fixed; inset: 0; z-index: 2147483647; overflow: auto; background: var(--cor-fundo); color: var(--cor-texto); font-family: var(--fonte-interface); }
    .veil[data-theme="sepia"] { --leitura-fundo: #F4ECD8; --leitura-texto: #342D22; --leitura-link: #075E54; color-scheme: light; }
    .veil[data-theme="dark"] { --leitura-fundo: #1E1F22; --leitura-texto: #D4D4D4; --leitura-link: #8AB4F8; color-scheme: dark; }
    .veil[data-theme="black"] { --leitura-fundo: #000000; --leitura-texto: #E6E6E6; --leitura-link: #8AB4F8; color-scheme: dark; }
    .toolbar { position: sticky; top: 0; z-index: 2; display: grid; gap: var(--espaco-3); padding: var(--espaco-3) var(--espaco-5); background: var(--cor-superficie); border-bottom: 1px solid var(--cor-linha); }
    .toolbar-head, .controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--espaco-2); }
    .toolbar-head { justify-content: space-between; }
    .toolbar strong { font-size: 16px; }
    button, select, input { accent-color: var(--cor-primaria); }
    button, select { min-height: var(--alvo-toque); padding: var(--espaco-2) var(--espaco-3); border: 2px solid var(--cor-primaria); border-radius: var(--raio-padrao); background: var(--cor-superficie); color: var(--cor-texto); font: 600 16px var(--fonte-interface); }
    button { cursor: pointer; }
    button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible { outline: var(--foco); outline-offset: 2px; }
    label { display: inline-flex; min-height: var(--alvo-toque); align-items: center; gap: var(--espaco-2); color: var(--cor-texto); font: 14px var(--fonte-interface); }
    input[type="range"] { box-sizing: border-box; width: 140px; min-height: var(--alvo-toque); padding: 0 8px; touch-action: pan-y; }
    .reading-info { display: flex; justify-content: space-between; gap: var(--espaco-4); color: var(--cor-texto); font: 14px var(--fonte-interface); }
    progress { width: 100%; height: 8px; accent-color: var(--cor-primaria); }
    .index { padding: var(--espaco-1) var(--espaco-3) var(--espaco-2); background: var(--cor-superficie); }
    .index[hidden] { display: none; }
    .index ol { display: grid; gap: var(--espaco-2); margin: 0; padding-left: var(--espaco-5); }
    .index a { display: flex; min-height: var(--alvo-toque); align-items: center; color: var(--leitura-link); font: 16px/1.4 var(--fonte-interface); }
    article { --fonte-leitura: "Literata", Georgia, serif; box-sizing: border-box; max-width: 760px; margin: var(--espaco-6) auto 80px; padding: 0 var(--espaco-5); background: var(--leitura-fundo); color: var(--leitura-texto); font: 20px/1.6 var(--fonte-leitura); overflow-wrap: anywhere; }
    article :where(h1, h2, h3, h4, h5, h6) { color: var(--leitura-texto); font-family: var(--fonte-leitura); line-height: 1.2; scroll-margin-top: 150px; }
    article a { color: var(--leitura-link); }
    article :where(img, video, iframe) { max-width: 100%; }
    article :where(pre, table) { max-width: 100%; overflow: auto; }
    article pre { white-space: pre-wrap; }
    article table { border-collapse: collapse; }
    article :where(th, td) { border: 1px solid var(--cor-linha); padding: var(--espaco-2); }
    @media (max-width: 600px) { article { margin-top: 20px; padding: 0 16px; } .toolbar { padding: 8px 12px; } label { flex-wrap: wrap; } }
  `;
  const veil = document.createElement("div");
  veil.className = "veil";
  veil.innerHTML = `
    <header class="toolbar">
      <div class="toolbar-head"><strong>Leitor Limpo</strong><button class="open-pdf" type="button" hidden></button><button type="button" aria-label="Fechar modo de leitura">Fechar</button></div>
      <div class="controls" aria-label="Controles de leitura">
        <button type="button" aria-label="Tema branco">Branco</button><button type="button" aria-label="Tema sépia">Sépia</button><button type="button" aria-label="Tema escuro">Escuro</button><button type="button" aria-label="Tema preto">Preto</button>
        <label>Fonte <select aria-label="Fonte"><option>Literata</option><option>Atkinson Hyperlegible Next</option><option>Lexend</option></select></label>
        <button type="button" aria-label="Diminuir fonte">A−</button><button type="button" aria-label="Aumentar fonte">A+</button>
        <label>Largura do texto <input aria-label="Largura do texto" type="range" min="560" max="1000" step="20"></label>
        <label>Entrelinha <input aria-label="Entrelinha" type="range" min="1.2" max="2.2" step="0.05"></label>
        <label>Alinhamento do texto <select aria-label="Alinhamento do texto"><option value="left">À esquerda</option><option value="justify">Justificado</option></select></label>
        <button type="button" aria-label="Índice" aria-expanded="false">Índice</button>
        <button type="button" aria-label="Iniciar rolagem" aria-pressed="false">Iniciar rolagem</button>
        <label>Velocidade da rolagem <input aria-label="Velocidade da rolagem" type="range" min="1" max="10" step="1"></label>
      </div>
      <nav class="index" aria-label="Índice do artigo" hidden><ol></ol></nav>
      <div class="reading-info"><span class="reading-time"></span><span class="remaining-time" aria-live="polite"></span></div>
      <progress aria-label="Progresso da leitura" value="0" max="100"></progress>
    </header>
    <article role="article"></article>
  `;
  const articleElement = veil.querySelector<HTMLElement>("article");
  if (!articleElement) return;
  articleElement.setAttribute("aria-label", article.title);
  articleElement.innerHTML = article.content;
  const headings = [...articleElement.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")];
  const index = veil.querySelector<HTMLElement>(".index");
  const indexList = index?.querySelector("ol");
  headings.forEach((heading, position) => {
    const label = heading.textContent?.trim();
    if (!label || !indexList) return;
    const slug =
      label
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `secao-${position + 1}`;
    heading.id = `${slug}-${position + 1}`;
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = label;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.history.replaceState(null, "", `#${heading.id}`);
      heading.scrollIntoView({ block: "start" });
      updateProgress();
    });
    item.append(link);
    indexList.append(item);
  });

  const fontSelect = veil.querySelector<HTMLSelectElement>('select[aria-label="Fonte"]');
  const widthInput = veil.querySelector<HTMLInputElement>('input[aria-label="Largura do texto"]');
  const lineHeightInput = veil.querySelector<HTMLInputElement>('input[aria-label="Entrelinha"]');
  const speedInput = veil.querySelector<HTMLInputElement>('input[aria-label="Velocidade da rolagem"]');
  const alignmentSelect = veil.querySelector<HTMLSelectElement>('select[aria-label="Alinhamento do texto"]');
  const progress = veil.querySelector<HTMLProgressElement>("progress");
  const remaining = veil.querySelector<HTMLElement>(".remaining-time");
  speedInput?.setAttribute("aria-valuemin", speedInput.min);
  speedInput?.setAttribute("aria-valuemax", speedInput.max);
  const wordCount = (articleElement.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;
  const totalMinutes = Math.ceil(wordCount / 200);
  const stopAutoScroll = () => {
    isScrolling = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    scrollButton?.setAttribute("aria-label", ui.start);
    scrollButton?.setAttribute("aria-pressed", "false");
    if (scrollButton) scrollButton.textContent = ui.start;
  };
  let isScrolling = false;
  let frame: number | null = null;
  let lastFrame = 0;
  const scrollButton = veil.querySelector<HTMLButtonElement>("button[aria-label='Iniciar rolagem']");
  const updateProgress = () => {
    const maxScroll = veil.scrollHeight - veil.clientHeight;
    const value = maxScroll > 0 ? Math.round((veil.scrollTop / maxScroll) * 100) : 0;
    if (progress) {
      progress.value = value;
      progress.setAttribute("aria-valuenow", String(value));
    }
    const wordsRemaining = Math.ceil((wordCount * (100 - value)) / 100);
    if (remaining) remaining.textContent = ui.remaining(Math.ceil(wordsRemaining / 200));
  };
  const savePreferences = () => {
    void browser.storage.local.set({ [preferenceKey]: preferences });
  };
  const applyPreferences = () => {
    veil.dataset.theme = preferences.theme;
    articleElement.dataset.theme = preferences.theme;
    articleElement.style.setProperty("--fonte-leitura", `"${preferences.font}", ${preferences.font === "Literata" ? "Georgia, serif" : "sans-serif"}`);
    articleElement.style.fontSize = `${preferences.fontSize}px`;
    articleElement.style.maxWidth = `${preferences.width}px`;
    articleElement.style.lineHeight = String(preferences.lineHeight);
    articleElement.style.textAlign = preferences.alignment;
    if (fontSelect) fontSelect.value = preferences.font;
    if (widthInput) widthInput.value = String(preferences.width);
    if (lineHeightInput) lineHeightInput.value = String(preferences.lineHeight);
    if (speedInput) speedInput.value = String(preferences.speed);
    if (alignmentSelect) alignmentSelect.value = preferences.alignment;
  };
  const closeButton = veil.querySelector<HTMLButtonElement>('button[aria-label="Fechar modo de leitura"]');
  const openPdfButton = veil.querySelector<HTMLButtonElement>("button.open-pdf");
  const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const themeButtons: [Preferences["theme"], string][] = [
    ["light", "branco"],
    ["sepia", "sépia"],
    ["dark", "escuro"],
    ["black", "preto"],
  ];
  const decreaseFont = veil.querySelector<HTMLButtonElement>('button[aria-label="Diminuir fonte"]');
  const increaseFont = veil.querySelector<HTMLButtonElement>('button[aria-label="Aumentar fonte"]');
  const indexButton = veil.querySelector<HTMLButtonElement>('button[aria-label="Índice"]');
  const scrollToTop = () => {
    const now = performance.now();
    if (now - lastFrame >= 32 && isScrolling) {
      veil.scrollTop += Number(speedInput?.value ?? defaults.speed) / 4;
      lastFrame = now;
      updateProgress();
    }
    if (isScrolling) frame = requestAnimationFrame(scrollToTop);
  };
  const closeReader = () => {
    stopAutoScroll();
    host.restorePage?.();
    host.remove();
    if (previousActiveElement?.isConnected && !previousActiveElement.hasAttribute("disabled")) previousActiveElement.focus({ preventScroll: true });
  };

  veil.querySelector<HTMLElement>(".reading-time")!.textContent = ui.time(totalMinutes);
  if (remaining) remaining.textContent = ui.remaining(totalMinutes);
  applyPreferences();
  for (const [theme, label] of themeButtons)
    veil.querySelector<HTMLButtonElement>(`button[aria-label="Tema ${label}"]`)?.addEventListener("click", () => {
      preferences.theme = theme;
      applyPreferences();
      savePreferences();
    });
  fontSelect?.addEventListener("change", () => {
    preferences.font = fontSelect.value as Preferences["font"];
    applyPreferences();
    savePreferences();
  });
  decreaseFont?.addEventListener("click", () => {
    preferences.fontSize = Math.max(14, preferences.fontSize - 2);
    applyPreferences();
    savePreferences();
  });
  increaseFont?.addEventListener("click", () => {
    preferences.fontSize = Math.min(32, preferences.fontSize + 2);
    applyPreferences();
    savePreferences();
  });
  widthInput?.addEventListener("input", () => {
    preferences.width = Number(widthInput.value);
    applyPreferences();
    savePreferences();
  });
  lineHeightInput?.addEventListener("input", () => {
    preferences.lineHeight = Number(lineHeightInput.value);
    applyPreferences();
    savePreferences();
  });
  alignmentSelect?.addEventListener("change", () => {
    preferences.alignment = alignmentSelect.value as Preferences["alignment"];
    applyPreferences();
    savePreferences();
  });
  indexButton?.addEventListener("click", () => {
    const expanded = indexButton.getAttribute("aria-expanded") === "true";
    indexButton.setAttribute("aria-expanded", String(!expanded));
    if (index) index.hidden = expanded;
  });
  scrollButton?.addEventListener("click", () => {
    if (isScrolling) {
      stopAutoScroll();
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    isScrolling = true;
    scrollButton.setAttribute("aria-label", ui.pause);
    scrollButton.setAttribute("aria-pressed", "true");
    scrollButton.textContent = ui.pause;
    lastFrame = 0;
    frame = requestAnimationFrame(scrollToTop);
  });
  speedInput?.addEventListener("input", () => {
    preferences.speed = Number(speedInput.value);
    speedInput.setAttribute("aria-valuenow", speedInput.value);
    savePreferences();
  });
  if (speedInput) speedInput.setAttribute("aria-valuenow", speedInput.value);
  veil.addEventListener("scroll", updateProgress, { passive: true });
  let onKeydown: ((event: KeyboardEvent) => void) | undefined;
  onKeydown = (event) => {
    if (event.key === "Escape") closeReader();
  };
  window.addEventListener("keydown", onKeydown);
  host.restorePage = () => {
    restorePage();
    stopAutoScroll();
    if (onKeydown) window.removeEventListener("keydown", onKeydown);
  };
  closeButton?.addEventListener("click", closeReader);
  if (onOpenPdf && openPdfButton) {
    openPdfButton.hidden = false;
    openPdfButton.textContent = ui.openPdf;
    openPdfButton.addEventListener("click", () => onOpenPdf(closeReader));
  }
  closeButton?.setAttribute("aria-label", ui.close);
  if (closeButton) closeButton.textContent = ui.close;
  themeButtons.forEach(([, old], index) => {
    const themeButton = veil.querySelector<HTMLButtonElement>(`button[aria-label="Tema ${old}"]`);
    themeButton?.setAttribute("aria-label", `${ui.theme} ${ui.themes[index]}`);
    if (themeButton) themeButton.textContent = ui.themes[index];
  });
  const labels = [...veil.querySelectorAll("label")];
  const labelText = [ui.font, ui.width, ui.line, ui.align, ui.speed];
  labels.forEach((label, index) => {
    if (label.firstChild) label.firstChild.textContent = `${labelText[index]} `;
  });
  decreaseFont?.setAttribute("aria-label", ui.decrease);
  increaseFont?.setAttribute("aria-label", ui.increase);
  indexButton?.setAttribute("aria-label", ui.index);
  if (indexButton) indexButton.textContent = ui.index;
  index?.setAttribute("aria-label", ui.indexLabel);
  scrollButton?.setAttribute("aria-label", ui.start);
  if (scrollButton) scrollButton.textContent = ui.start;
  progress?.setAttribute("aria-label", ui.progress);
  if (alignmentSelect) {
    alignmentSelect.setAttribute("aria-label", ui.align);
    alignmentSelect.options[0].textContent = ui.left;
    alignmentSelect.options[1].textContent = ui.justify;
  }
  shadow.append(style, veil);
  sourceBody.inert = true;
  sourceBody.setAttribute("aria-hidden", "true");
  document.documentElement.append(host);
  closeButton?.focus();
  updateProgress();
}
