import { browser } from "wxt/browser";
import { loadReaderFonts, readerFontFamily } from "./reader-fonts";
import { readerStyle } from "./reader-style";
import { createReaderToolbar, type ReaderPreferences } from "./reader-toolbar";
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

type Preferences = ReaderPreferences;

const defaults: Preferences = {
  language: "pt-BR",
  theme: "light",
  font: "Georgia",
  fontSize: 20,
  width: 760,
  widthMode: "custom",
  widthPercent: 100,
  lineHeight: 1.65,
  alignment: "left",
  speed: 3,
  showImages: false,
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
      widthPercent:
        typeof stored?.widthPercent === "number"
          ? limit(stored.widthPercent, defaults.widthPercent, 30, 100, 5)
          : stored?.widthMode === "full"
            ? 100
            : typeof stored?.width === "number" && Number.isFinite(stored.width)
              ? 0
              : defaults.widthPercent,
      alignment: ["center", "right", "justify"].includes(stored?.alignment ?? "") ? stored!.alignment! : "left",
      speed: limit(stored?.speed, defaults.speed, 1, 10, 1),
      showImages: stored?.showImages === true,
    };
  } catch {
    return { ...defaults };
  }
}

export async function toggleReader(article: ExtractedArticle, onOpenPdf?: (close: () => void) => void, onClose?: () => void): Promise<void> {
  if (closeActiveReader()) return;

  const preferences = await loadPreferences();
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const ui = {
    "pt-BR": {
      toolbar: "Controles de leitura",
      size: "Tamanho",
      more: "Mais opções de leitura",
      print: "Imprimir artigo",
      images: "Exibir imagens",
      chooseTheme: "Escolher tema",
      chooseFont: "Escolher fonte",
      chooseAlignment: "Escolher alinhamento",
      right: "À direita",
      alignLeft: "Alinhar à esquerda",
      alignCenter: "Alinhar ao centro",
      alignRight: "Alinhar à direita",
      alignJustify: "Justificar texto",
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
      toolbar: "Reading controls",
      size: "Size",
      more: "More reading options",
      print: "Print article",
      images: "Show images",
      chooseTheme: "Choose theme",
      chooseFont: "Choose font",
      chooseAlignment: "Choose alignment",
      right: "Right",
      alignLeft: "Align left",
      alignCenter: "Align center",
      alignRight: "Align right",
      alignJustify: "Justify text",
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
      toolbar: "Controles de lectura",
      size: "Tamaño",
      more: "Más opciones de lectura",
      print: "Imprimir artículo",
      images: "Mostrar imágenes",
      chooseTheme: "Elegir tema",
      chooseFont: "Elegir fuente",
      chooseAlignment: "Elegir alineación",
      right: "A la derecha",
      alignLeft: "Alinear a la izquierda",
      alignCenter: "Alinear al centro",
      alignRight: "Alinear a la derecha",
      alignJustify: "Justificar texto",
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
  const root = document.documentElement;
  const previousRootStyle = root.getAttribute("style");
  const previousBodyStyle = sourceBody.getAttribute("style");
  const previousPosition = { left: window.scrollX, top: window.scrollY };
  const previousInert = sourceBody.inert;
  const previousAriaHidden = sourceBody.getAttribute("aria-hidden");
  const restorePage = () => {
    if (previousRootStyle === null) root.removeAttribute("style");
    else root.setAttribute("style", previousRootStyle);
    if (previousBodyStyle === null) sourceBody.removeAttribute("style");
    else sourceBody.setAttribute("style", previousBodyStyle);
    sourceBody.inert = previousInert;
    if (previousAriaHidden === null) sourceBody.removeAttribute("aria-hidden");
    else sourceBody.setAttribute("aria-hidden", previousAriaHidden);
  };
  host.restorePage = restorePage;
  host.dataset.leitorLimpoHost = "true";
  host.style.cssText = "all: initial; display: block;";
  host.setAttribute("aria-label", "Leitor Limpo");
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = readerStyle;
  const fonts = loadReaderFonts();
  const veil = document.createElement("div");
  veil.className = "veil";
  veil.innerHTML = `<div class="reader-layout"><nav id="reader-index" class="index" hidden><div class="index-heading"><strong class="index-title"></strong><button class="close-index" type="button">×</button></div><ol></ol></nav><main class="reading-content"><article role="article"></article></main></div>`;
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
  const outline: { level: number; item: HTMLLIElement }[] = [];
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
    const level = Number(heading.tagName.slice(1));
    while (outline.length && outline[outline.length - 1]!.level >= level) outline.pop();
    const parent = outline[outline.length - 1]?.item;
    let list = indexList;
    if (parent) list = parent.querySelector(":scope > ol") ?? parent.appendChild(document.createElement("ol"));
    list.append(item);
    outline.push({ level, item });
  });

  const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let isScrolling = false;
  let frame: number | null = null;
  let lastFrame = 0;
  const toolbar = createReaderToolbar(preferences, ui, {
    change: () => {
      applyPreferences();
      savePreferences();
    },
    index: () => setIndexOpen(toolbar.indexButton.getAttribute("aria-expanded") !== "true"),
    close: () => closeReader(),
    scroll: () => toggleAutoScroll(),
    print: () => {
      stopAutoScroll();
      toolbar.closePopovers();
      window.print();
    },
    ...(onOpenPdf ? { openPdf: () => onOpenPdf(closeReader) } : {}),
  });
  veil.prepend(toolbar.element);
  veil.querySelector(".reading-content")!.prepend(toolbar.readingInfo);
  const wordCount = (articleElement.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;
  const totalMinutes = Math.ceil(wordCount / 200);
  const updateProgress = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const value = maxScroll > 0 ? Math.round((window.scrollY / maxScroll) * 100) : 0;
    toolbar.progress.value = value;
    toolbar.progress.setAttribute("aria-valuenow", String(value));
    toolbar.remaining.textContent = ui.remaining(Math.ceil(Math.ceil((wordCount * (100 - value)) / 100) / 200));
  };
  const savePreferences = () => {
    void browser.storage.local.set({ [preferenceKey]: preferences });
  };
  const applyPreferences = () => {
    if (preferences.widthPercent === 0 && articleElement.parentElement?.clientWidth) {
      const container = articleElement.parentElement;
      const computed = getComputedStyle(container);
      const available = container.clientWidth - parseFloat(computed.paddingLeft) - parseFloat(computed.paddingRight);
      preferences.widthPercent = Math.max(30, Math.min(100, Math.round((preferences.width / Math.max(1, available)) * 20) * 5));
      savePreferences();
    }
    preferences.widthMode = preferences.widthPercent === 100 ? "full" : "custom";
    const theme = preferences.theme === "auto" ? (colorScheme.matches ? "dark" : "light") : preferences.theme;
    veil.dataset.theme = theme;
    articleElement.dataset.theme = theme;
    articleElement.style.setProperty("--fonte-leitura", readerFontFamily(preferences.font));
    articleElement.style.fontSize = `${preferences.fontSize}px`;
    articleElement.style.maxWidth = `${preferences.widthPercent || defaults.widthPercent}%`;
    articleElement.style.lineHeight = String(preferences.lineHeight);
    articleElement.style.textAlign = preferences.alignment;
    veil.dataset.images = String(preferences.showImages);
    articleElement.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      const source = article.images?.[image.dataset.readerImage ?? ""];
      image.hidden = !preferences.showImages || !source;
      if (image.hidden) image.removeAttribute("src");
      else if (image.getAttribute("src") !== source) {
        image.referrerPolicy = "no-referrer";
        image.loading = "lazy";
        image.decoding = "async";
        image.src = source!;
      }
    });
    toolbar.update();
    updateProgress();
  };
  const stopAutoScroll = () => {
    isScrolling = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    toolbar.setScrolling(false);
  };
  const scrollFrame = () => {
    if (!isScrolling) return;
    const now = performance.now();
    if (now - lastFrame >= 32) {
      window.scrollBy(0, preferences.speed / 4);
      lastFrame = now;
      updateProgress();
    }
    frame = requestAnimationFrame(scrollFrame);
  };
  const toggleAutoScroll = () => {
    if (isScrolling) {
      stopAutoScroll();
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    isScrolling = true;
    lastFrame = 0;
    toolbar.setScrolling(true);
    frame = requestAnimationFrame(scrollFrame);
  };
  const closeIndexButton = veil.querySelector<HTMLButtonElement>(".close-index")!;
  closeIndexButton.setAttribute("aria-label", ui.closeIndex);
  closeIndexButton.title = ui.closeIndex;
  index?.setAttribute("aria-label", ui.indexLabel);
  veil.querySelector(".index-title")!.textContent = ui.index;
  const setIndexOpen = (open: boolean, returnFocus = true) => {
    toolbar.indexButton.setAttribute("aria-expanded", String(open));
    veil.dataset.indexOpen = String(open);
    if (index) index.hidden = !open;
    if (open) closeIndexButton.focus({ preventScroll: true });
    else if (returnFocus) toolbar.indexButton.focus({ preventScroll: true });
  };
  closeIndexButton.addEventListener("click", () => setIndexOpen(false));
  const closeReader = () => {
    stopAutoScroll();
    host.restorePage?.();
    host.remove();
    window.scrollTo(previousPosition);
    onClose?.();
    if (previousActiveElement?.isConnected && !previousActiveElement.hasAttribute("disabled")) previousActiveElement.focus({ preventScroll: true });
  };
  host.closeReader = closeReader;
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    if (toolbar.closePopovers()) {
      event.preventDefault();
      return;
    }
    if (index && !index.hidden) {
      event.preventDefault();
      setIndexOpen(false);
    } else closeReader();
  };
  const onSystemTheme = () => {
    if (preferences.theme === "auto") applyPreferences();
  };
  window.addEventListener("keydown", onKeydown);
  colorScheme.addEventListener("change", onSystemTheme);
  window.addEventListener("scroll", updateProgress, { passive: true });
  const toolbarObserver = new ResizeObserver(() => {
    veil.style.setProperty("--toolbar-height", `${toolbar.element.getBoundingClientRect().height}px`);
    updateProgress();
  });
  toolbarObserver.observe(toolbar.element);
  const printMedia = window.matchMedia("print");
  let printDisplay: { value: string; priority: string; hadStyle: boolean } | null = null;
  const beforePrint = () => {
    if (printDisplay) return;
    stopAutoScroll();
    toolbar.closePopovers();
    printDisplay = {
      value: sourceBody.style.getPropertyValue("display"),
      priority: sourceBody.style.getPropertyPriority("display"),
      hadStyle: sourceBody.hasAttribute("style"),
    };
    sourceBody.style.setProperty("display", "none", "important");
  };
  const afterPrint = () => {
    if (!printDisplay) return;
    if (printDisplay.value) sourceBody.style.setProperty("display", printDisplay.value, printDisplay.priority);
    else sourceBody.style.removeProperty("display");
    if (!printDisplay.hadStyle && !sourceBody.style.length) sourceBody.removeAttribute("style");
    printDisplay = null;
  };
  const onPrintMedia = () => {
    if (printMedia.matches) beforePrint();
    else afterPrint();
  };
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
  printMedia.addEventListener("change", onPrintMedia);
  host.restorePage = () => {
    stopAutoScroll();
    toolbar.destroy();
    toolbarObserver.disconnect();
    window.removeEventListener("keydown", onKeydown);
    colorScheme.removeEventListener("change", onSystemTheme);
    window.removeEventListener("beforeprint", beforePrint);
    window.removeEventListener("afterprint", afterPrint);
    printMedia.removeEventListener("change", onPrintMedia);
    afterPrint();
    fonts.dispose();
    window.removeEventListener("scroll", updateProgress);
    restorePage();
  };
  toolbar.readingTime.textContent = ui.time(totalMinutes);
  shadow.append(style, veil);
  sourceBody.inert = true;
  sourceBody.setAttribute("aria-hidden", "true");
  for (const [property, value] of Object.entries({
    overflow: "auto",
    height: "auto",
    "max-height": "none",
    margin: "0",
    padding: "0",
    "scroll-behavior": "auto",
  }))
    root.style.setProperty(property, value, "important");
  sourceBody.style.setProperty("display", "none", "important");
  document.documentElement.append(host);
  window.scrollTo(0, 0);
  void fonts.ready.then((loaded) => {
    if (!host.isConnected) return;
    host.dataset.fonts = loaded ? "ready" : "unavailable";
    toolbar.fit(true);
  });
  applyPreferences();
  toolbar.fit();
  toolbar.closeButton.focus({ preventScroll: true });
  updateProgress();
}
