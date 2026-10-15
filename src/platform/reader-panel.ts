import { browser } from "wxt/browser";
import { readerStyle } from "./reader-style";
import type { ExtractedArticle } from "./extract-article";

const hostSelector = "[data-leitor-limpo-host='true']";
const preferenceKey = "readerPreferences";
type ReaderHost = HTMLElement & { restorePage?: () => void; closeReader?: () => void };

export function closeActiveReader(): boolean {
  const current = document.querySelector<ReaderHost>(hostSelector);
  if (!current) return false;
  if (current.closeReader) current.closeReader();
  else {
    current.restorePage?.();
    current.remove();
  }
  return true;
}

type Preferences = {
  language: "pt-BR" | "en" | "es";
  theme: "light" | "sepia" | "dark" | "black" | "auto";
  font: "Georgia" | "Literata" | "Atkinson Hyperlegible Next" | "Lexend";
  fontSize: number;
  width: number;
  widthMode: "custom" | "full";
  lineHeight: number;
  alignment: "left" | "center" | "justify";
  speed: number;
};

const defaults: Preferences = {
  language: "pt-BR",
  theme: "light",
  font: "Georgia",
  fontSize: 20,
  width: 760,
  widthMode: "custom",
  lineHeight: 1.65,
  alignment: "left",
  speed: 3,
};

async function loadPreferences(): Promise<Preferences> {
  try {
    const stored = (await browser.storage.local.get(preferenceKey))[preferenceKey] as Partial<Preferences> | undefined;
    const allowedFonts: Preferences["font"][] = ["Georgia", "Literata", "Atkinson Hyperlegible Next", "Lexend"];
    const limit = (value: unknown, fallback: number, minimum: number, maximum: number, step: number) => {
      if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
      return Math.min(maximum, Math.max(minimum, Math.round(value / step) * step));
    };
    return {
      language: ["en", "es"].includes(stored?.language ?? "") ? (stored!.language as "en" | "es") : defaults.language,
      theme: ["light", "sepia", "dark", "black", "auto"].includes(stored?.theme ?? "") ? (stored!.theme as Preferences["theme"]) : defaults.theme,
      font: allowedFonts.includes(stored?.font as Preferences["font"]) ? (stored!.font as Preferences["font"]) : defaults.font,
      fontSize: limit(stored?.fontSize, defaults.fontSize, 14, 32, 2),
      width: limit(stored?.width, defaults.width, 560, 1000, 20),
      lineHeight: limit(stored?.lineHeight, defaults.lineHeight, 1.2, 2.2, 0.05),
      widthMode: stored?.widthMode === "full" ? "full" : "custom",
      alignment: ["center", "justify"].includes(stored?.alignment ?? "") ? stored!.alignment! : "left",
      speed: limit(stored?.speed, defaults.speed, 1, 10, 1),
    };
  } catch {
    return { ...defaults };
  }
}

export async function toggleReader(article: ExtractedArticle, onOpenPdf?: (close: () => void) => void): Promise<void> {
  if (closeActiveReader()) return;

  const preferences = await loadPreferences();
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const ui = {
    "pt-BR": {
      close: "Fechar",
      openPdf: "Abrir PDF local",
      themes: ["Branco", "Sépia", "Escuro", "Preto", "Automático"],
      theme: "Tema",
      font: "Fonte",
      decrease: "Diminuir fonte",
      increase: "Aumentar fonte",
      width: "Largura do texto",
      line: "Entrelinha",
      align: "Alinhamento do texto",
      left: "À esquerda",
      center: "Centralizado",
      closeIndex: "Recolher navegação",
      fullWidth: "100% da área disponível",
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
      themes: ["White", "Sepia", "Dark", "Black", "Automatic"],
      theme: "Theme",
      font: "Font",
      decrease: "Decrease font size",
      increase: "Increase font size",
      width: "Text width",
      line: "Line spacing",
      align: "Text alignment",
      left: "Left",
      center: "Centered",
      closeIndex: "Collapse navigation",
      fullWidth: "100% of available space",
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
      themes: ["Blanco", "Sepia", "Oscuro", "Negro", "Automático"],
      theme: "Tema",
      font: "Fuente",
      decrease: "Reducir tamaño",
      increase: "Aumentar tamaño",
      width: "Ancho del texto",
      line: "Interlineado",
      align: "Alineación del texto",
      left: "A la izquierda",
      center: "Centrado",
      closeIndex: "Replegar navegación",
      fullWidth: "100% del espacio disponible",
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
  const host = document.createElement("div") as ReaderHost;
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
    ${readerStyle}
  `;
  const veil = document.createElement("div");
  veil.className = "veil";
  veil.innerHTML = `
    <header class="toolbar" role="toolbar" aria-label="Controles de leitura">
      <div class="controls" aria-label="Controles de leitura">
        <div class="group theme-group"><span class="group-title theme-label">Tema</span><div class="button-row">
          <button type="button" aria-label="Tema branco">Branco</button><button type="button" aria-label="Tema sépia">Sépia</button><button type="button" aria-label="Tema escuro">Escuro</button><button type="button" aria-label="Tema preto">Preto</button><button type="button" aria-label="Tema automático">Auto</button>
        </div></div>
        <div class="group"><label>Fonte <select aria-label="Fonte"><option>Georgia</option><option>Literata</option><option>Atkinson Hyperlegible Next</option><option>Lexend</option></select></label></div>
        <div class="group"><span class="group-title size-label">Tamanho</span><div class="button-row"><button type="button" aria-label="Diminuir fonte">A−</button><output class="font-size">20</output><button type="button" aria-label="Aumentar fonte">A+</button></div></div>
        <div class="group"><label>Largura do texto <input aria-label="Largura do texto" type="range" min="560" max="1020" step="20"><output class="width-value" aria-hidden="true"></output></label></div>
        <div class="group"><label>Entrelinha <input aria-label="Entrelinha" type="range" min="1.2" max="2.2" step="0.05"></label></div>
        <button class="close-reader" type="button" aria-label="Fechar modo de leitura">Fechar</button>
      </div>
      <div class="utility-row">
        <div class="group alignment-group"><label>Alinhamento do texto <select aria-label="Alinhamento do texto"><option value="left">À esquerda</option><option value="center">Centralizado</option><option value="justify">Justificado</option></select></label></div>
        <div class="reading-info"><strong class="reader-brand">Leitor Limpo</strong><span class="reading-time"></span><span class="remaining-time" aria-live="polite"></span></div>
        <div class="reader-tools">
        <button type="button" aria-label="Índice" aria-expanded="false" aria-controls="reader-index">Índice</button>
        <button type="button" aria-label="Iniciar rolagem" aria-pressed="false">Iniciar rolagem</button>
        <label>Velocidade da rolagem <input aria-label="Velocidade da rolagem" type="range" min="1" max="10" step="1"></label>
        <button class="open-pdf" type="button" hidden></button>
        </div>
      </div>
      <progress aria-label="Progresso da leitura" value="0" max="100"></progress>
    </header>
    <div class="reader-layout">
      <nav id="reader-index" class="index" aria-label="Índice do artigo" hidden><div class="index-heading"><strong class="index-title">Índice</strong><button class="close-index" type="button" aria-label="Fechar índice">×</button></div><ol></ol></nav>
      <main class="reading-content"><article role="article"></article></main>
    </div>
  `;
  const articleElement = veil.querySelector<HTMLElement>("article");
  if (!articleElement) return;
  articleElement.setAttribute("aria-label", article.title);
  articleElement.innerHTML = article.content;
  if (!articleElement.querySelector("h1")) {
    const title = document.createElement("h1");
    title.textContent = article.title;
    articleElement.prepend(title);
  }
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
      if (window.matchMedia("(max-width: 900px)").matches) setIndexOpen(false, false);
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
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
    const theme = preferences.theme === "auto" ? (colorScheme.matches ? "dark" : "light") : preferences.theme;
    veil.dataset.theme = theme;
    articleElement.dataset.theme = theme;
    articleElement.style.setProperty(
      "--fonte-leitura",
      `"${preferences.font}", ${["Literata", "Georgia"].includes(preferences.font) ? "Georgia, serif" : "sans-serif"}`,
    );
    articleElement.style.fontSize = `${preferences.fontSize}px`;
    articleElement.style.maxWidth = preferences.widthMode === "full" ? "100%" : `${preferences.width}px`;
    articleElement.style.lineHeight = String(preferences.lineHeight);
    articleElement.style.textAlign = preferences.alignment;
    const size = veil.querySelector<HTMLOutputElement>(".font-size");
    if (size) size.textContent = String(preferences.fontSize);
    for (const [theme, label] of themeButtons) {
      veil.querySelector<HTMLButtonElement>(`button[data-theme-value="${theme}"]`)?.setAttribute("aria-pressed", String(theme === preferences.theme));
      veil.querySelector<HTMLButtonElement>(`button[aria-label="Tema ${label}"]`)?.setAttribute("aria-pressed", String(theme === preferences.theme));
    }
    if (fontSelect) fontSelect.value = preferences.font;
    if (widthInput) {
      widthInput.value = String(preferences.widthMode === "full" ? 1020 : preferences.width);
      widthInput.setAttribute("aria-valuetext", preferences.widthMode === "full" ? ui.fullWidth : `${preferences.width} px`);
    }
    const widthValue = veil.querySelector<HTMLOutputElement>(".width-value");
    if (widthValue) widthValue.textContent = preferences.widthMode === "full" ? "100%" : `${preferences.width} px`;
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
    ["auto", "automático"],
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
  host.closeReader = closeReader;

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
    preferences.widthMode = widthInput.value === widthInput.max ? "full" : "custom";
    preferences.width = Math.min(1000, Number(widthInput.value));
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
  const closeIndexButton = veil.querySelector<HTMLButtonElement>(".close-index");
  const setIndexOpen = (open: boolean, returnFocus = true) => {
    indexButton?.setAttribute("aria-expanded", String(open));
    veil.dataset.indexOpen = String(open);
    if (index) index.hidden = !open;
    if (open) closeIndexButton?.focus({ preventScroll: true });
    else if (returnFocus) indexButton?.focus({ preventScroll: true });
  };
  indexButton?.addEventListener("click", () => setIndexOpen(indexButton.getAttribute("aria-expanded") !== "true"));
  closeIndexButton?.addEventListener("click", () => setIndexOpen(false));
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
    if (event.key !== "Escape") return;
    if (index && !index.hidden) {
      event.preventDefault();
      setIndexOpen(false);
    } else closeReader();
  };
  window.addEventListener("keydown", onKeydown);
  const updateSystemTheme = () => {
    if (preferences.theme === "auto") applyPreferences();
  };
  colorScheme.addEventListener("change", updateSystemTheme);
  host.restorePage = () => {
    restorePage();
    stopAutoScroll();
    if (onKeydown) window.removeEventListener("keydown", onKeydown);
    colorScheme.removeEventListener("change", updateSystemTheme);
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
    themeButton?.setAttribute("data-theme-value", themeButtons[index]![0]);
    if (themeButton) {
      themeButton.textContent = themeButtons[index]![0] === "auto" ? "Auto" : ui.themes[index];
      themeButton.title = ui.themes[index]!;
    }
  });
  const labels = [...veil.querySelectorAll("label")];
  const labelText = [ui.font, ui.width, ui.line, ui.align, ui.speed];
  labels.forEach((label, index) => {
    if (label.firstChild) label.firstChild.textContent = `${labelText[index]} `;
  });
  veil.querySelector<HTMLElement>(".theme-label")!.textContent = ui.theme;
  veil.querySelector<HTMLElement>(".size-label")!.textContent = { "pt-BR": "Tamanho", en: "Size", es: "Tamaño" }[preferences.language];
  veil
    .querySelector<HTMLElement>(".toolbar")!
    .setAttribute("aria-label", { "pt-BR": "Controles de leitura", en: "Reading controls", es: "Controles de lectura" }[preferences.language]);
  decreaseFont?.setAttribute("aria-label", ui.decrease);
  increaseFont?.setAttribute("aria-label", ui.increase);
  indexButton?.setAttribute("aria-label", ui.index);
  if (indexButton) indexButton.textContent = ui.index;
  index?.setAttribute("aria-label", ui.indexLabel);
  veil.querySelector<HTMLElement>(".index-title")!.textContent = ui.index;
  closeIndexButton?.setAttribute("aria-label", ui.closeIndex);
  closeIndexButton?.setAttribute("title", ui.closeIndex);
  scrollButton?.setAttribute("aria-label", ui.start);
  if (scrollButton) scrollButton.textContent = ui.start;
  progress?.setAttribute("aria-label", ui.progress);
  if (alignmentSelect) {
    alignmentSelect.setAttribute("aria-label", ui.align);
    alignmentSelect.options[0].textContent = ui.left;
    alignmentSelect.options[1].textContent = ui.center;
    alignmentSelect.options[2].textContent = ui.justify;
  }
  shadow.append(style, veil);
  const toolbar = veil.querySelector<HTMLElement>(".toolbar")!;
  const toolbarObserver = new ResizeObserver(() => {
    veil.style.setProperty("--toolbar-height", `${toolbar.getBoundingClientRect().height}px`);
  });
  toolbarObserver.observe(toolbar);
  const restore = host.restorePage;
  host.restorePage = () => {
    toolbarObserver.disconnect();
    restore?.();
  };
  sourceBody.inert = true;
  sourceBody.setAttribute("aria-hidden", "true");
  document.documentElement.append(host);
  closeButton?.focus();
  updateProgress();
}
