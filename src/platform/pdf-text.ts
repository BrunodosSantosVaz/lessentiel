import type { TextContent } from "pdfjs-dist/types/src/display/api";

type Viewport = { width: number; convertToViewportPoint: (x: number, y: number) => number[] };
type Line = { text: string; x: number; y: number; right: number; height: number };

// PDF text is positioned ink. Rebuild visual lines before choosing reading order.
export function pdfParagraphs(content: TextContent, viewport: Viewport): string[] {
  const fragments: Line[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
    if (![x, y, item.width, item.height].every(Number.isFinite)) continue;
    fragments.push({ text: item.str, x, y, right: x + Math.abs(item.width), height: Math.abs(item.height) || 12 });
  }
  fragments.sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: Line[][] = [];
  for (const fragment of fragments) {
    const row = rows.at(-1);
    if (row && Math.abs(row[0].y - fragment.y) <= Math.max(2, fragment.height * 0.25)) row.push(fragment);
    else rows.push([fragment]);
  }
  const lines: Line[] = [];
  const lineRows: Line[][] = [];
  for (const row of rows) {
    const chunks: Line[] = [];
    row.sort((a, b) => a.x - b.x);
    let line: Line | undefined;
    for (const fragment of row) {
      const gap = line ? fragment.x - line.right : Infinity;
      if (line && gap <= Math.max(24, line.height * 2)) {
        const separator = gap <= line.height * 0.15 || /\s$/.test(line.text) || /^\s/.test(fragment.text) ? "" : " ";
        line.text += separator + fragment.text;
        line.right = Math.max(line.right, fragment.right);
        line.height = Math.max(line.height, fragment.height);
      } else {
        line = { ...fragment };
        lines.push(line);
        chunks.push(line);
      }
    }
    lineRows.push(chunks);
  }
  const middle = viewport.width / 2;
  // shortcut: detect two clear text columns; complex tables and irregular layouts need tagged-PDF support.
  const pairedRows = lineRows.filter(
    (row) =>
      row.some((part) => part.x < middle && part.right < middle && part.text.trim().length >= 20) &&
      row.some((part) => part.x > middle && part.text.trim().length >= 20),
  ).length;
  const columns = pairedRows >= 3;
  const ordered: Line[] = [];
  let pending: Line[] = [];
  const flushColumns = () => {
    ordered.push(...pending.filter((line) => line.x < middle), ...pending.filter((line) => line.x >= middle));
    pending = [];
  };
  for (const line of lines) {
    if (!columns) ordered.push(line);
    else if (line.x < middle && line.right > middle) {
      flushColumns();
      ordered.push(line);
    } else pending.push(line);
  }
  flushColumns();
  const paragraphs: string[] = [];
  let previous: Line | undefined;
  for (const line of ordered) {
    const text = line.text.trim().replace(/\s+/g, " ");
    const newParagraph =
      !previous ||
      (columns && line.x < middle !== previous.x < middle) ||
      line.y <= previous.y ||
      line.y - previous.y > Math.max(line.height, previous.height) * 1.5 ||
      Math.max(line.height, previous.height) / Math.min(line.height, previous.height) > 1.3 ||
      (line.x - previous.x > line.height && /[.!?…]$/.test(previous.text.trim()));
    if (newParagraph) paragraphs.push(text);
    else {
      const last = paragraphs.length - 1;
      const ending = paragraphs[last];
      paragraphs[last] = ending.endsWith("\u00ad") ? ending.slice(0, -1) + text : ending + (ending.endsWith("-") ? "" : " ") + text;
    }
    previous = line;
  }
  return paragraphs;
}
