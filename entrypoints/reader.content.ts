import { extractArticle } from "../src/platform/extract-article";
import { closeActiveReader, toggleReader } from "../src/platform/reader-panel";
import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";

export default defineContentScript({
  matches: [],
  registration: "runtime",
  async main() {
    if (closeActiveReader()) return true;
    const article = extractArticle(document);
    if (!article) {
      await showUnavailableMessage();
      return false;
    }
    await toggleReader(article);
    return true;
  },
});

async function showUnavailableMessage(): Promise<void> {
  const { readerPreferences } = await browser.storage.local.get("readerPreferences");
  const language = (readerPreferences as { language?: string } | undefined)?.language;
  const message =
    language === "en"
      ? "Could not identify the main text on this page."
      : language === "es"
        ? "No se pudo identificar el texto principal de esta página."
        : "Não foi possível identificar o texto principal desta página.";
  const host = document.createElement("div");
  host.dataset.leitorLimpoHost = "true";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent =
    ":host{all:initial}.message{position:fixed;z-index:2147483647;inset:16px 16px auto auto;padding:16px 20px;background:#fff;color:#17332e;border:2px solid #075e54;border-radius:8px;font:16px system-ui,sans-serif}";
  const notice = document.createElement("div");
  notice.className = "message";
  notice.setAttribute("role", "status");
  notice.textContent = message;
  shadow.append(style, notice);
  document.documentElement.append(host);
  window.setTimeout(() => host.remove(), 5000);
}
