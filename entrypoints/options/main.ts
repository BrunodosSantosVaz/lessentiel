import { browser } from "wxt/browser";

const translations = {
  "pt-BR": {
    heading: "Preferências",
    sites: "Ativação automática por site",
    help: "A permissão é solicitada somente para o site escolhido.",
    site: "Site",
    add: "Adicionar site automático",
    remove: "Remover",
    save: "Salvar preferências",
    saved: "Preferências salvas neste dispositivo.",
    invalid: "Informe um endereço https:// ou http:// válido.",
    denied: "A permissão não foi concedida.",
    language: "Idioma",
    pdf: "Abrir PDF local",
  },
  en: {
    heading: "Settings",
    sites: "Automatic activation by site",
    help: "Permission is requested only for the selected site.",
    site: "Site",
    add: "Add automatic site",
    remove: "Remove",
    save: "Save preferences",
    saved: "Preferences saved on this device.",
    invalid: "Enter a valid https:// or http:// address.",
    denied: "Permission was not granted.",
    language: "Language",
    pdf: "Open local PDF",
  },
  es: {
    heading: "Preferencias",
    sites: "Activación automática por sitio",
    help: "El permiso se solicita solo para el sitio elegido.",
    site: "Sitio",
    add: "Añadir sitio automático",
    remove: "Quitar",
    save: "Guardar preferencias",
    saved: "Preferencias guardadas en este dispositivo.",
    invalid: "Introduce una dirección https:// o http:// válida.",
    denied: "No se concedió el permiso.",
    language: "Idioma",
    pdf: "Abrir PDF local",
  },
} as const;

const language = document.querySelector<HTMLSelectElement>("#language")!;
const siteInput = document.querySelector<HTMLInputElement>("#site")!;
const siteList = document.querySelector<HTMLUListElement>("#sites")!;
const status = document.querySelector<HTMLElement>("#status")!;
let sites: string[] = [];
type PermissionCalls = Pick<typeof browser.permissions, "request" | "contains" | "remove">;
const testPermissions = __MLA_TEST_MODE__ ? (window as Window & { __mlaTestPermissions?: PermissionCalls }).__mlaTestPermissions : undefined;
const permissions: PermissionCalls = testPermissions ?? browser.permissions;

function renderLanguage() {
  const t = translations[language.value as keyof typeof translations];
  document.documentElement.lang = language.value;
  document.querySelector("#heading")!.textContent = t.heading;
  document.querySelector("#sites-heading")!.textContent = t.sites;
  document.querySelector("#site-help")!.textContent = t.help;
  document.querySelector("#site-label")!.textContent = t.site;
  document.querySelector<HTMLButtonElement>("#add-site")!.textContent = t.add;
  document.querySelector<HTMLButtonElement>("#save")!.textContent = t.save;
  document.querySelector("#language-label")!.textContent = t.language;
  document.querySelector<HTMLAnchorElement>("#pdf-link")!.textContent = t.pdf;
  renderSites();
}

function renderSites() {
  const removeLabel = translations[language.value as keyof typeof translations].remove;
  siteList.replaceChildren(
    ...sites.map((site) => {
      const item = document.createElement("li");
      item.append(document.createTextNode(site));
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${removeLabel} ${new URL(site.slice(0, -1)).hostname}`;
      button.addEventListener("click", () => void removeSite(site));
      item.append(button);
      return item;
    }),
  );
}

async function removeSite(site: string) {
  if (!(await permissions.remove({ origins: [site] }))) return;
  sites = sites.filter((item) => item !== site);
  await browser.storage.local.set({ automaticSites: sites });
  renderSites();
}

document.querySelector<HTMLButtonElement>("#add-site")!.addEventListener("click", async () => {
  const t = translations[language.value as keyof typeof translations];
  const value = siteInput.value.trim();
  let url: URL;
  try {
    url = new URL(value.replace(/\/\*$/, ""));
  } catch {
    status.textContent = t.invalid;
    return;
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || value !== `${url.origin}/*`) {
    status.textContent = t.invalid;
    return;
  }
  const pattern = `${url.origin}/*`;
  if (!(await permissions.request({ origins: [pattern] })) || !(await permissions.contains({ origins: [pattern] }))) {
    status.textContent = t.denied;
    return;
  }
  if (!sites.includes(pattern)) sites = [...sites, pattern];
  await browser.storage.local.set({ automaticSites: sites });
  siteInput.value = "";
  status.textContent = "";
  renderSites();
});

document.querySelector<HTMLButtonElement>("#save")!.addEventListener("click", async () => {
  const stored = await browser.storage.local.get("readerPreferences");
  const preferences = stored.readerPreferences && typeof stored.readerPreferences === "object" ? (stored.readerPreferences as Record<string, unknown>) : {};
  await browser.storage.local.set({ readerPreferences: { ...preferences, language: language.value } });
  status.textContent = translations[language.value as keyof typeof translations].saved;
});
language.addEventListener("change", renderLanguage);
void browser.storage.local.get(["readerPreferences", "automaticSites"]).then(({ readerPreferences, automaticSites }) => {
  language.value = (readerPreferences as { language?: string } | undefined)?.language ?? "pt-BR";
  sites = Array.isArray(automaticSites) ? (automaticSites as string[]) : [];
  renderLanguage();
});
