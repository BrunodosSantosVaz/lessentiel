import type { Locator, Page } from "@playwright/test";

export async function revealReaderControl(page: Page, control: Locator) {
  if (await control.isVisible()) return;
  const more = page.getByRole("button", { name: "Mais opções de leitura", exact: true });
  if ((await more.getAttribute("aria-expanded")) !== "true") await more.click();
}
async function choose(page: Page, kind: "theme" | "font" | "alignment", value: string) {
  const labels = { theme: ["Tema", "Escolher tema"], font: ["Fonte", "Escolher fonte"], alignment: ["Alinhamento do texto", "Escolher alinhamento"] };
  const alignments: Record<string, string> = {
    "À esquerda": "Alinhar à esquerda",
    Centralizado: "Alinhar ao centro",
    "À direita": "Alinhar à direita",
    Justificado: "Justificar texto",
  };
  const previewName = kind === "alignment" ? alignments[value] : `${labels[kind][0]} ${value}`;
  const preview = page.getByRole("button", { name: previewName, exact: true });
  if (await preview.isVisible()) {
    await preview.click();
    return;
  }
  const trigger = page.getByRole("button", { name: labels[kind][1], exact: true });
  if (await trigger.isVisible()) {
    await trigger.click();
    await page.getByRole("menuitemradio", { name: value, exact: true }).click();
    return;
  }
  const select = page.getByRole("combobox", { name: labels[kind][0], exact: true });
  await revealReaderControl(page, select);
  await select.selectOption({ label: value });
}
export const chooseReaderTheme = (page: Page, label: string) => choose(page, "theme", label);
export const chooseReaderFont = (page: Page, label: string) => choose(page, "font", label);
export const chooseReaderAlignment = (page: Page, label: string) => choose(page, "alignment", label);
