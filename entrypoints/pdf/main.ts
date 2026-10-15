import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { browser } from "wxt/browser";
import { toggleReader } from "../../src/platform/reader-panel";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
const picker = document.querySelector<HTMLInputElement>("#pdf-file")!;
const button = document.querySelector<HTMLButtonElement>("#open-pdf")!;
const status = document.querySelector<HTMLElement>("#status")!;
const messages = {
  "pt-BR": [
    "Abrir PDF local",
    "O PDF excede o limite de 100 MB.",
    "O PDF excede o limite de 1000 páginas.",
    "Lendo o PDF neste dispositivo…",
    "Este PDF está sem camada de texto selecionável. PDFs digitalizados precisam de OCR.",
    "página(s) lida(s) localmente.",
    "Não foi possível ler este PDF. Verifique se o arquivo é válido.",
    "A leitura avançada ainda não está liberada neste build.",
  ],
  en: [
    "Open local PDF",
    "This PDF exceeds the 100 MB limit.",
    "This PDF exceeds the 1,000-page limit.",
    "Reading the PDF on this device…",
    "This PDF has no selectable text layer. Scanned PDFs require OCR.",
    "page(s) read locally.",
    "Could not read this PDF. Check that the file is valid.",
    "Advanced reading is not enabled in this build yet.",
  ],
  es: [
    "Abrir PDF local",
    "El PDF supera el límite de 100 MB.",
    "El PDF supera el límite de 1.000 páginas.",
    "Leyendo el PDF en este dispositivo…",
    "Este PDF no tiene texto seleccionable. Los PDF escaneados necesitan OCR.",
    "página(s) leída(s) localmente.",
    "No se pudo leer el PDF. Comprueba que el archivo sea válido.",
    "La lectura avanzada aún no está habilitada en esta versión.",
  ],
} as const;
let strings: readonly string[] = messages["pt-BR"];
void browser.storage.local.get("readerPreferences").then(({ readerPreferences }) => {
  const lang = (readerPreferences as { language?: string } | undefined)?.language;
  strings = messages[lang === "en" || lang === "es" ? lang : "pt-BR"];
  document.querySelector<HTMLButtonElement>("#open-pdf")!.textContent = strings[0];
  document.documentElement.lang = lang ?? "pt-BR";
  window.document.querySelector("#original-pdf")!.textContent =
    lang === "en" ? "Back to original PDF" : lang === "es" ? "Volver al PDF original" : "Voltar ao PDF original";
  if (!__READER_ENABLED__) status.textContent = strings[7];
});
if (!__READER_ENABLED__) {
  button.hidden = true;
  status.textContent = strings[7];
}
button.addEventListener("click", () => {
  if (__READER_ENABLED__) window.setTimeout(() => picker.click(), 40);
});
const source = new URL(location.href).searchParams.get("source");
const originalButton = window.document.querySelector<HTMLButtonElement>("#original-pdf")!;
const returnToOriginal = () => {
  if (source) void browser.runtime.sendMessage({ type: "RETURN_TO_PDF", url: source });
};
originalButton.addEventListener("click", returnToOriginal);

async function readPdf(data: ArrayBuffer, title: string, automatic = false) {
  if (data.byteLength > 100 * 1024 * 1024) {
    status.textContent = strings[1];
    return;
  }
  button.disabled = true;
  status.textContent = strings[3];
  let document: pdfjs.PDFDocumentProxy | undefined;
  let task: ReturnType<typeof pdfjs.getDocument> | undefined;
  try {
    task = pdfjs.getDocument({ data });
    document = await task.promise;
    if (document.numPages > 1000) {
      status.textContent = strings[2];
      return;
    }
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
      page.cleanup();
    }
    const text = pages.filter(Boolean).join("\n\n");
    if (!text) status.textContent = strings[4];
    else {
      const content = window.document.createElement("div");
      for (const paragraph of text.split(/\n\n+/)) {
        const element = window.document.createElement("p");
        element.textContent = paragraph;
        content.append(element);
      }
      status.textContent = `${document.numPages} ${strings[5]}`;
      await toggleReader(
        { title, byline: null, content: content.innerHTML },
        automatic
          ? undefined
          : (close) => {
              close();
              window.setTimeout(() => picker.click(), 40);
            },
        automatic ? returnToOriginal : undefined,
      );
    }
  } catch {
    status.textContent = strings[6];
  } finally {
    await task?.destroy();
    button.disabled = false;
    picker.value = "";
  }
}
picker.addEventListener("change", async () => {
  if (!__READER_ENABLED__) return;
  const file = picker.files?.[0];
  if (!file) return;
  if (file.size > 100 * 1024 * 1024) {
    status.textContent = strings[1];
    return;
  }
  await readPdf(await file.arrayBuffer(), file.name);
});

async function readCurrentPdf() {
  if (!__READER_ENABLED__ || !source) return;
  try {
    const url = new URL(source);
    if (url.protocol !== "file:" || !/\.pdf$/i.test(url.pathname) || !(await browser.extension.isAllowedFileSchemeAccess()))
      throw new Error("Local PDF access unavailable");
    originalButton.hidden = false;
    button.hidden = true;
    const response = await fetch(url.href);
    if (!response.ok || !response.body) throw new Error("Local PDF unavailable");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 100 * 1024 * 1024) {
        await reader.cancel();
        status.textContent = strings[1];
        return;
      }
      chunks.push(value);
    }
    const data = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    await readPdf(data.buffer, decodeURIComponent(url.pathname.split("/").pop() ?? "PDF"), true);
  } catch {
    status.textContent = strings[6];
  }
}
void readCurrentPdf();
