import { browser } from "wxt/browser";

const button = document.querySelector<HTMLButtonElement>("#activate-reader");
const status = document.querySelector<HTMLElement>("#status");

button?.addEventListener("click", async () => {
  button.disabled = true;
  if (status) status.textContent = "Abrindo o modo de leitura…";
  const activated = await browser.runtime.sendMessage({ type: "ACTIVATE_READER" });
  if (!activated && status) status.textContent = "Não foi possível abrir a leitura nesta página.";
  window.close();
});
