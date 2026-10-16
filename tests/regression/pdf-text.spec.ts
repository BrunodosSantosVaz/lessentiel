import { expect, test } from "@playwright/test";
import type { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";
import { pdfParagraphs } from "../../src/platform/pdf-text";

const viewport = { width: 600, convertToViewportPoint: (x: number, y: number) => [x, 800 - y] };
const item = (str: string, x: number, y: number, width = 100): TextItem => ({
  str,
  dir: "ltr",
  transform: [12, 0, 0, 12, x, y],
  width,
  height: 12,
  fontName: "f1",
  hasEOL: false,
});
const content = (items: TextItem[]): TextContent => ({ items, styles: {}, lang: null });

test("#47 RN-0003 recompõe palavras fragmentadas, hifens e parágrafos sem inventar colunas", () => {
  expect(
    pdfParagraphs(
      content([
        item("Lei", 50, 700, 14),
        item("tura", 64, 700, 20),
        item("fluida", 88, 700, 32),
        item("com infor\u00ad", 50, 684),
        item("mação completa e guarda-", 50, 668),
        item("chuva.", 50, 652),
        item("Outro parágrafo.", 50, 620),
      ]),
      viewport,
    ),
  ).toEqual(["Leitura fluida com informação completa e guarda-chuva.", "Outro parágrafo."]);
});

test("#47 RN-0003 detecta duas colunas mesmo com palavras em fragmentos e ignora entradas vazias", () => {
  const items: TextItem[] = [item(" ", 0, 0)];
  for (const y of [700, 684, 668]) {
    items.push(item("Texto da ", 50, y, 50), item("coluna esquerda.", 100, y, 90));
    items.push(item("Texto da ", 330, y, 50), item("coluna direita.", 380, y, 90));
  }
  expect(pdfParagraphs(content(items.reverse()), viewport)).toEqual([
    Array(3).fill("Texto da coluna esquerda.").join(" "),
    Array(3).fill("Texto da coluna direita.").join(" "),
  ]);
});
