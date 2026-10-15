import type { ExtractedArticle } from "./extract-article";

const hostSelector = "[data-leitor-limpo-host='true']";

export function toggleReader(article: ExtractedArticle): void {
  const current = document.querySelector<HTMLElement & { restorePage?: () => void }>(hostSelector);
  if (current) {
    current.restorePage?.();
    current.remove();
    return;
  }

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
    .toolbar { position: sticky; top: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #fff; border-bottom: 1px solid #65736e; }
    .toolbar strong { font-size: 16px; }
    button { min-height: 44px; padding: 8px 16px; border: 2px solid #075e54; border-radius: 8px; background: #fff; color: #17332e; font: 600 16px system-ui, sans-serif; cursor: pointer; }
    button:focus-visible { outline: 3px solid #174ea6; outline-offset: 2px; }
    article { box-sizing: border-box; max-width: 760px; margin: 32px auto 80px; padding: 0 24px; color: #17332e; font: 20px/1.65 Georgia, serif; overflow-wrap: anywhere; }
    article :where(h1, h2, h3, h4, h5, h6) { color: #17332e; font-family: system-ui, sans-serif; line-height: 1.25; }
    article :where(img, video, iframe) { max-width: 100%; }
    article :where(pre, table) { max-width: 100%; overflow: auto; }
    article pre { white-space: pre-wrap; }
    article table { border-collapse: collapse; }
    article :where(th, td) { border: 1px solid #65736e; padding: 8px; }
    @media (max-width: 600px) { article { margin-top: 20px; padding: 0 16px; font-size: 18px; } .toolbar { padding: 8px 12px; } }
  `;
  const veil = document.createElement("div");
  veil.className = "veil";
  veil.innerHTML = `<header class="toolbar"><strong>Leitor Limpo</strong><button type="button" aria-label="Fechar modo de leitura">Fechar</button></header><article role="article"></article>`;
  const articleElement = veil.querySelector("article");
  if (!articleElement) return;
  articleElement.setAttribute("aria-label", article.title);
  articleElement.innerHTML = article.content;
  let onKeydown: ((event: KeyboardEvent) => void) | undefined;
  const closeButton = veil.querySelector("button");
  const closeReader = () => {
    host.restorePage?.();
    host.remove();
  };
  onKeydown = (event) => {
    if (event.key === "Escape") closeReader();
  };
  window.addEventListener("keydown", onKeydown);
  host.restorePage = () => {
    restorePage();
    if (onKeydown) window.removeEventListener("keydown", onKeydown);
  };
  closeButton?.addEventListener("click", () => {
    closeReader();
  });
  shadow.append(style, veil);
  sourceBody.inert = true;
  sourceBody.setAttribute("aria-hidden", "true");
  document.documentElement.append(host);
  closeButton?.focus();
}
