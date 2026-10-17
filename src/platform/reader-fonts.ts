import { browser } from "wxt/browser";

export const readerFontFamily = (name: string) =>
  name === "Georgia" ? 'Georgia, "Times New Roman", serif' : `"MLA ${name}", ${name === "Literata" ? "Georgia, serif" : "sans-serif"}`;

export function loadReaderFonts() {
  const faces: FontFace[] = [];
  let disposed = false;
  const families = [
    ["Literata", "literata"],
    ["Atkinson Hyperlegible Next", "atkinson-hyperlegible-next"],
    ["Lexend", "lexend"],
  ];
  const ranges = {
    latin:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext":
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF",
  };
  // Register binary FontFaces with the document: @font-face inside Shadow DOM is not reliable in Chromium.
  const ready = Promise.allSettled(
    families.flatMap(([family, file]) =>
      Object.entries(ranges).map(async ([subset, unicodeRange]) => {
        const response = await fetch(
          (browser.runtime as typeof browser.runtime & { getURL: (path: string) => string }).getURL(`/fonts/${file}-${subset}.woff2`),
        );
        if (!response.ok) throw new Error("Packaged font unavailable");
        const face = new FontFace(`MLA ${family}`, await response.arrayBuffer(), { style: "normal", weight: "400 700", unicodeRange });
        await face.load();
        if (!disposed) {
          document.fonts.add(face);
          faces.push(face);
        }
      }),
    ),
  ).then((results) => results.every((result) => result.status === "fulfilled"));
  return {
    ready,
    dispose: () => {
      disposed = true;
      faces.forEach((face) => document.fonts.delete(face));
    },
  };
}
