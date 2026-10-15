import { browser } from "wxt/browser";
import type { ExtractedArticle } from "./extract-article";

const hostSelector = "[data-leitor-limpo-host='true']";
const preferenceKey = "readerPreferences";

type Preferences = {
  theme: "light" | "sepia";
  font: "Georgia" | "Arial" | "Lexend";
  fontSize: number;
  width: number;
  lineHeight: number;
  alignment: "left" | "justify";
  speed: number;
};

const defaults: Preferences = {
  theme: "light",
  font: "Georgia",
  fontSize: 20,
  width: 760,
  lineHeight: 1.65,
  alignment: "left",
  speed: 3,
};

async function loadPreferences(): Promise<Preferences> {
  try {
    const stored = (await browser.storage.local.get(preferenceKey))[preferenceKey] as Partial<Preferences> | undefined;
    const allowedFonts: Preferences["font"][] = ["Georgia", "Arial", "Lexend"];
    const limit = (value: unknown, fallback: number, minimum: number, maximum: number, step: number) => {
      if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
      return Math.min(maximum, Math.max(minimum, Math.round(value / step) * step));
    };
    return {
      theme: stored?.theme === "sepia" ? "sepia" : "light",
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

export async function toggleReader(article: ExtractedArticle): Promise<void> {
  const current = document.querySelector<HTMLElement & { restorePage?: () => void }>(hostSelector);
  if (current) {
    current.restorePage?.();
    current.remove();
    return;
  }

  const preferences = await loadPreferences();
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
  style.textContent = `
    :host { all: initial; color-scheme: light; font-family: system-ui, sans-serif; }
    .veil { position: fixed; inset: 0; z-index: 2147483647; overflow: auto; background: #f7f8f6; color: #17332e; }
    .veil[data-theme="sepia"] { background: #f4ecd8; color: #34281b; color-scheme: light; }
    .toolbar { position: sticky; top: 0; z-index: 2; display: grid; gap: 10px; padding: 12px 20px; background: #fff; border-bottom: 1px solid #65736e; }
    .toolbar-head, .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .toolbar-head { justify-content: space-between; }
    .toolbar strong { font-size: 16px; }
    button, select, input { accent-color: #075e54; }
    button, select { min-height: 44px; padding: 8px 12px; border: 2px solid #075e54; border-radius: 8px; background: #fff; color: #17332e; font: 600 16px system-ui, sans-serif; }
    button { cursor: pointer; }
    button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible { outline: 3px solid #174ea6; outline-offset: 2px; }
    label { display: inline-flex; align-items: center; gap: 6px; color: #17332e; font: 14px system-ui, sans-serif; }
    input[type="range"] { width: 100px; }
    .reading-info { display: flex; justify-content: space-between; gap: 16px; color: #17332e; font: 14px system-ui, sans-serif; }
    progress { width: 100%; height: 8px; accent-color: #075e54; }
    .index { padding: 4px 12px 8px; background: #fff; }
    .index[hidden] { display: none; }
    .index ol { display: grid; gap: 6px; margin: 0; padding-left: 24px; }
    .index a { color: #075e54; font: 16px/1.4 system-ui, sans-serif; }
    article { box-sizing: border-box; max-width: 760px; margin: 32px auto 80px; padding: 0 24px; color: #17332e; font: 20px/1.65 Georgia, serif; overflow-wrap: anywhere; }
    .veil[data-theme="sepia"] article, .veil[data-theme="sepia"] article :where(h1, h2, h3, h4, h5, h6) { color: #34281b; }
    article :where(h1, h2, h3, h4, h5, h6) { color: #17332e; font-family: system-ui, sans-serif; line-height: 1.25; scroll-margin-top: 150px; }
    article :where(img, video, iframe) { max-width: 100%; }
    article :where(pre, table) { max-width: 100%; overflow: auto; }
    article pre { white-space: pre-wrap; }
    article table { border-collapse: collapse; }
    article :where(th, td) { border: 1px solid #65736e; padding: 8px; }
    @media (max-width: 600px) { article { margin-top: 20px; padding: 0 16px; } .toolbar { padding: 8px 12px; } label { flex-wrap: wrap; } }
  `;
  const veil = document.createElement("div");
  veil.className = "veil";
  veil.innerHTML = `
    <header class="toolbar">
      <div class="toolbar-head"><strong>Leitor Limpo</strong><button type="button" aria-label="Fechar modo de leitura">Fechar</button></div>
      <div class="controls" aria-label="Controles de leitura">
        <button type="button" aria-label="Tema claro">Claro</button><button type="button" aria-label="Tema sépia">Sépia</button>
        <label>Fonte <select aria-label="Fonte"><option>Georgia</option><option>Arial</option><option>Lexend</option></select></label>
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
  const totalMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const stopAutoScroll = () => {
    isScrolling = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    scrollButton?.setAttribute("aria-label", "Iniciar rolagem");
    scrollButton?.setAttribute("aria-pressed", "false");
    if (scrollButton) scrollButton.textContent = "Iniciar rolagem";
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
    const wordsRead = Math.floor((wordCount * value) / 100);
    if (remaining) remaining.textContent = `restam ${Math.max(0, totalMinutes - Math.floor(wordsRead / 200))} min`;
  };
  const savePreferences = () => {
    void browser.storage.local.set({ [preferenceKey]: preferences });
  };
  const applyPreferences = () => {
    veil.dataset.theme = preferences.theme;
    articleElement.dataset.theme = preferences.theme;
    articleElement.style.fontFamily = preferences.font === "Lexend" ? '"Lexend", sans-serif' : preferences.font;
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
  const themeLight = veil.querySelector<HTMLButtonElement>('button[aria-label="Tema claro"]');
  const themeSepia = veil.querySelector<HTMLButtonElement>('button[aria-label="Tema sépia"]');
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
  };

  veil.querySelector<HTMLElement>(".reading-time")!.textContent = `${totalMinutes} min de leitura`;
  if (remaining) remaining.textContent = `restam ${totalMinutes} min`;
  applyPreferences();
  themeLight?.addEventListener("click", () => {
    preferences.theme = "light";
    applyPreferences();
    savePreferences();
  });
  themeSepia?.addEventListener("click", () => {
    preferences.theme = "sepia";
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
    scrollButton.setAttribute("aria-label", "Pausar rolagem");
    scrollButton.setAttribute("aria-pressed", "true");
    scrollButton.textContent = "Pausar rolagem";
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
  shadow.append(style, veil);
  sourceBody.inert = true;
  sourceBody.setAttribute("aria-hidden", "true");
  document.documentElement.append(host);
  closeButton?.focus();
  updateProgress();
}
