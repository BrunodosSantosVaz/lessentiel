import type { TextContent } from "pdfjs-dist/types/src/display/api";

type Viewport = { width: number; convertToViewportPoint: (x: number, y: number) => number[] };
type Line = { text: string; x: number; y: number; right: number; height: number };
const layout = {
  fallbackHeight: 12,
  baselineTolerance: 0.25,
  minimumBaselineTolerance: 2,
  wordGap: 2,
  minimumWordGap: 24,
  joinedGlyphGap: 0.15,
  minimumColumnLines: 3,
  minimumColumnText: 20,
  paragraphGap: 1.5,
  fontChange: 1.3,
};

function textRows(content: TextContent, viewport: Viewport): Line[][] {
  const fragments: Line[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
    if (![x, y, item.width, item.height].every(Number.isFinite)) continue;
    fragments.push({ text: item.str, x, y, right: x + Math.abs(item.width), height: Math.abs(item.height) || layout.fallbackHeight });
  }
  fragments.sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: Line[][] = [];
  for (const fragment of fragments) {
    const row = rows.at(-1);
    if (row && Math.abs(row[0].y - fragment.y) <= Math.max(layout.minimumBaselineTolerance, fragment.height * layout.baselineTolerance)) row.push(fragment);
    else rows.push([fragment]);
  }
  return rows;
}

function joinRow(row: Line[]): Line[] {
  const chunks: Line[] = [];
  row.sort((a, b) => a.x - b.x);
  let line: Line | undefined;
  for (const fragment of row) {
    const gap = line ? fragment.x - line.right : Infinity;
    if (line && gap <= Math.max(layout.minimumWordGap, line.height * layout.wordGap)) {
      const separator = gap <= line.height * layout.joinedGlyphGap || /\s$/.test(line.text) || /^\s/.test(fragment.text) ? "" : " ";
      line.text += separator + fragment.text;
      line.right = Math.max(line.right, fragment.right);
      line.height = Math.max(line.height, fragment.height);
    } else {
      line = { ...fragment };
      chunks.push(line);
    }
  }
  return chunks;
}

function hasColumns(lines: Line[], middle: number): boolean {
  // shortcut: detect two clear text columns; complex tables and irregular layouts need tagged-PDF support.
  const text = lines.filter((line) => line.text.trim().length >= layout.minimumColumnText);
  const left = text.filter((line) => line.right < middle);
  const right = text.filter((line) => line.x > middle);
  if (left.length < layout.minimumColumnLines || right.length < layout.minimumColumnLines) return false;
  const gutter = Math.min(...right.map((line) => line.x)) - Math.max(...left.map((line) => line.right));
  return gutter >= layout.minimumWordGap;
}

function readingOrder(lines: Line[], middle: number): Line[] {
  const ordered: Line[] = [];
  let pending: Line[] = [];
  const flush = () => {
    ordered.push(...pending.filter((line) => line.x < middle), ...pending.filter((line) => line.x >= middle));
    pending = [];
  };
  for (const line of lines) {
    if (line.x < middle && line.right > middle) {
      flush();
      ordered.push(line);
    } else pending.push(line);
  }
  flush();
  return ordered;
}

function startsParagraph(line: Line, previous: Line, middle: number, columns: boolean): boolean {
  return (
    (columns && line.x < middle !== previous.x < middle) ||
    line.y <= previous.y ||
    line.y - previous.y > Math.max(line.height, previous.height) * layout.paragraphGap ||
    Math.max(line.height, previous.height) / Math.min(line.height, previous.height) > layout.fontChange ||
    (line.x - previous.x > line.height && /[.!?…]$/.test(previous.text.trim()))
  );
}

// PDF text is positioned ink. Rebuild visual lines before choosing reading order.
export function pdfParagraphs(content: TextContent, viewport: Viewport): string[] {
  const lines = textRows(content, viewport).flatMap(joinRow);
  const middle = viewport.width / 2;
  const columns = hasColumns(lines, middle);
  const ordered = columns ? readingOrder(lines, middle) : lines;
  const paragraphs: string[] = [];
  let previous: Line | undefined;
  for (const line of ordered) {
    const text = line.text.trim().replace(/\s+/g, " ");
    if (!previous || startsParagraph(line, previous, middle, columns)) paragraphs.push(text);
    else {
      const last = paragraphs.length - 1;
      const ending = paragraphs[last];
      paragraphs[last] = ending.endsWith("\u00ad") ? ending.slice(0, -1) + text : ending + (ending.endsWith("-") ? "" : " ") + text;
    }
    previous = line;
  }
  return paragraphs;
}
