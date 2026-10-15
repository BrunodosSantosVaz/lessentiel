import { extractArticle } from "../src/platform/extract-article";
import { toggleReader } from "../src/platform/reader-panel";
import { defineContentScript } from "wxt/utils/define-content-script";

export default defineContentScript({
  matches: [],
  registration: "runtime",
  main() {
    const article = extractArticle(document);
    if (!article) {
      showUnavailableMessage();
      return false;
    }
    toggleReader(article);
    return true;
  },
});

function showUnavailableMessage(): void {
  const host = document.createElement("div");
  host.dataset.leitorLimpoHost = "true";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>:host{all:initial}.message{position:fixed;z-index:2147483647;inset:16px 16px auto auto;padding:16px 20px;background:#fff;color:#17332e;border:2px solid #075e54;border-radius:8px;font:16px system-ui,sans-serif}</style><div class="message" role="status">Não foi possível identificar o texto principal desta página.</div>`;
  document.documentElement.append(host);
  window.setTimeout(() => host.remove(), 5000);
}
