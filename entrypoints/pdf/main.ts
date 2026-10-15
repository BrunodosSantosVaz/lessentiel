import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { browser } from "wxt/browser";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
const picker = document.querySelector<HTMLInputElement>("#pdf-file")!;
const button = document.querySelector<HTMLButtonElement>("#open-pdf")!;
const status = document.querySelector<HTMLElement>("#status")!;
const article = document.querySelector<HTMLElement>("#article")!;
const messages = {
  "pt-BR": [
    "Abrir PDF local",
    "O PDF excede o limite de 100 MB.",
    "Lendo o PDF neste dispositivo…",
    "Este PDF está sem camada de texto selecionável. PDFs digitalizados precisam de OCR.",
    "página(s) lida(s) localmente.",
    "Não foi possível ler este PDF. Verifique se o arquivo é válido.",
  ],
  en: [
    "Open local PDF",
    "This PDF exceeds the 100 MB limit.",
    "Reading the PDF on this device…",
    "This PDF has no selectable text layer. Scanned PDFs require OCR.",
    "page(s) read locally.",
    "Could not read this PDF. Check that the file is valid.",
  ],
  es: [
    "Abrir PDF local",
    "El PDF supera el límite de 100 MB.",
    "Leyendo el PDF en este dispositivo…",
    "Este PDF no tiene texto seleccionable. Los PDF escaneados necesitan OCR.",
    "página(s) leída(s) localmente.",
    "No se pudo leer el PDF. Comprueba que el archivo sea válido.",
  ],
} as const;
let strings: readonly string[] = messages["pt-BR"];
void browser.storage.local.get("readerPreferences").then(({ readerPreferences }) => {
  const lang = (readerPreferences as { language?: string } | undefined)?.language;
  strings = messages[lang === "en" || lang === "es" ? lang : "pt-BR"];
  document.querySelector<HTMLButtonElement>("#open-pdf")!.textContent = strings[0];
  document.documentElement.lang = lang ?? "pt-BR";
});
button.addEventListener("click", () => window.setTimeout(() => picker.click(), 40));
picker.addEventListener("change", async () => {
  const file = picker.files?.[0];
  if (!file) return;
  if (file.size > 100 * 1024 * 1024) {
    status.textContent = strings[1];
    return;
  }
  button.disabled = true;
  status.textContent = strings[2];
  article.replaceChildren();
  try {
    const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let number = 1; number <= document.numPages; number += 1) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .trim(),
      );
    }
    const text = pages.filter(Boolean).join("\n\n");
    if (!text) status.textContent = strings[3];
    else {
      article.textContent = text;
      status.textContent = `${document.numPages} ${strings[4]}`;
    }
  } catch {
    status.textContent = strings[5];
  } finally {
    button.disabled = false;
    picker.value = "";
  }
});
