import { browser } from "wxt/browser";

const button = document.querySelector<HTMLButtonElement>("#activate-reader");
const status = document.querySelector<HTMLElement>("#status");
if (!__READER_ENABLED__ && button) button.hidden = true;
const pdfLink = document.querySelector<HTMLAnchorElement>('a[href="pdf.html"]');
if (!__READER_ENABLED__ && pdfLink) pdfLink.hidden = true;
const labels = {
  "pt-BR": [
    "Abra o texto desta página em uma leitura sem distrações.",
    "Ativar modo de leitura",
    "Abrir PDF local",
    "Preferências",
    "Abrindo o modo de leitura…",
    "Não foi possível abrir a leitura nesta página.",
  ],
  en: [
    "Read this page without distractions.",
    "Open reader mode",
    "Open local PDF",
    "Settings",
    "Opening reader mode…",
    "Reader mode is unavailable on this page.",
  ],
  es: [
    "Lee esta página sin distracciones.",
    "Abrir modo de lectura",
    "Abrir PDF local",
    "Preferencias",
    "Abriendo el modo de lectura…",
    "No se puede abrir el modo de lectura en esta página.",
  ],
} as const;

void browser.storage.local.get("readerPreferences").then(({ readerPreferences }) => {
  const lang = (readerPreferences as { language?: string } | undefined)?.language;
  const t = labels[lang === "en" || lang === "es" ? lang : "pt-BR"];
  document.querySelector("main > p")!.textContent = t[0];
  button!.textContent = t[1];
  document.querySelectorAll<HTMLAnchorElement>("main a")[0].textContent = t[2];
  document.querySelectorAll<HTMLAnchorElement>("main a")[1].textContent = t[3];
  document.documentElement.lang = lang ?? "pt-BR";
});

button?.addEventListener("click", async () => {
  if (!__READER_ENABLED__) return;
  button.disabled = true;
  const prefs = await browser.storage.local.get("readerPreferences");
  const lang = (prefs.readerPreferences as { language?: string } | undefined)?.language;
  const t = labels[lang === "en" || lang === "es" ? lang : "pt-BR"];
  if (status) status.textContent = t[4];
  const activated = await browser.runtime.sendMessage({ type: "ACTIVATE_READER" });
  if (!activated && status) status.textContent = t[5];
  window.close();
});
