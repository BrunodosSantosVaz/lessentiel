import { browser } from "wxt/browser";
const labels = {
  "pt-BR": [
    "Abra o texto desta página em uma leitura sem distrações.",
    "Ativar modo de leitura",
    "Preferências",
    "Abrindo o modo de leitura…",
    "Não foi possível abrir esta página. Para documentos locais, habilite o acesso a arquivos nas preferências.",
    "Menos ruído. Mais leitura.",
    "Uma página, só o texto.",
    "Leitura processada neste dispositivo",
  ],
  en: [
    "Read this page without distractions.",
    "Open reader mode",
    "Settings",
    "Opening reader mode…",
    "Could not open this page. For local documents, enable file access in Settings.",
    "Less noise. More reading.",
    "Just you and the text.",
    "Reading processed on this device",
  ],
  es: [
    "Lee esta página sin distracciones.",
    "Abrir modo de lectura",
    "Preferencias",
    "Abriendo el modo de lectura…",
    "No se pudo abrir esta página. Para documentos locales, habilita el acceso a archivos en Preferencias.",
    "Menos ruido. Más lectura.",
    "Solo tú y el texto.",
    "Lectura procesada en este dispositivo",
  ],
} as const;
const button = document.querySelector<HTMLButtonElement>("#activate-reader")!;
const status = document.querySelector<HTMLElement>("#status")!;
let text: readonly string[] = labels["pt-BR"];
button.hidden = !__READER_ENABLED__;
void browser.storage.local.get("readerPreferences").then(({ readerPreferences }) => {
  const lang = (readerPreferences as { language?: string } | undefined)?.language;
  const locale = lang === "en" || lang === "es" ? lang : "pt-BR";
  text = labels[locale];
  document.documentElement.lang = locale;
  document.querySelector("#intro")!.textContent = text[0];
  button.textContent = text[1];
  document.querySelector("#settings-label")!.textContent = text[2];
  document.querySelector("#tagline")!.textContent = text[5];
  document.querySelector("#heading")!.textContent = text[6];
  document.querySelector("#privacy-label")!.textContent = text[7];
});
button.addEventListener("click", async () => {
  if (!__READER_ENABLED__) return;
  button.disabled = true;
  status.textContent = text[3];
  try {
    const activated = await browser.runtime.sendMessage({ type: "ACTIVATE_READER" });
    if (activated) window.close();
    else status.textContent = text[4];
  } catch {
    status.textContent = text[4];
  } finally {
    button.disabled = false;
  }
});
