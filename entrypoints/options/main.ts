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
const localToggle = document.querySelector<HTMLInputElement>("#automatic-local")!;
const manifest = browser.runtime.getManifest();
document.querySelector("#app-version")!.textContent = manifest.version_name ?? manifest.version;
const automaticSettings = document.querySelector<HTMLElement>("#automatic-settings")!;
automaticSettings.hidden = !__READER_ENABLED__;
const extraTranslations = {
  "pt-BR": {
    "settings-tagline": "Leitura no seu ritmo",
    "settings-intro": "Escolha como o leitor se abre. Seus ajustes ficam neste dispositivo.",
    "language-heading": "Sua interface",
    "language-help": "A fonte, o tema e o tamanho podem ser ajustados durante a leitura.",
    "local-heading": "Documentos locais",
    "local-label": "Abrir arquivos locais automaticamente",
    "file-help": "Para HTML e PDF, ative “Permitir acesso a URLs de arquivo” nos detalhes da extensão.",
    "configure-files": "Configurar acesso a arquivos",
    "empty-sites": "Nenhum site adicionado. Você pode abrir outras páginas pelo ícone da extensão.",
    "about-heading": "Sobre o L’Essentiel",
    "about-tagline": "Menos ruído. Mais leitura.",
    "about-description":
      "Um espaço tranquilo para ler páginas web e PDFs locais. Seus textos e preferências são processados neste dispositivo, sem conta ou sincronização.",
    "version-label": "Versão",
    "license-label": "Licença",
    "privacy-heading": "Seus dados",
    "privacy-value": "Neste dispositivo",
    "author-label": "Projeto",
    "docs-link": "Documentação",
    "issues-link": "Relatar problema",
    "releases-link": "Notas de versão",
  },
  en: {
    "settings-tagline": "Reading at your pace",
    "settings-intro": "Choose how the reader opens. Your settings stay on this device.",
    "language-heading": "Your interface",
    "language-help": "Adjust font, theme and size while reading.",
    "local-heading": "Local documents",
    "local-label": "Open local files automatically",
    "file-help": "For HTML and PDF, enable “Allow access to file URLs” in extension details.",
    "configure-files": "Configure file access",
    "empty-sites": "No sites added. Open other pages using the extension icon.",
    "about-heading": "About L’Essentiel",
    "about-tagline": "Less noise. More reading.",
    "about-description":
      "A quiet space to read web pages and local PDFs. Your text and preferences are processed on this device, without an account or synchronization.",
    "version-label": "Version",
    "license-label": "License",
    "privacy-heading": "Your data",
    "privacy-value": "On this device",
    "author-label": "Project",
    "docs-link": "Documentation",
    "issues-link": "Report an issue",
    "releases-link": "Release notes",
  },
  es: {
    "settings-tagline": "Lectura a tu ritmo",
    "settings-intro": "Elige cómo se abre el lector. Tus ajustes quedan en este dispositivo.",
    "language-heading": "Tu interfaz",
    "language-help": "Ajusta la fuente, el tema y el tamaño durante la lectura.",
    "local-heading": "Documentos locales",
    "local-label": "Abrir archivos locales automáticamente",
    "file-help": "Para HTML y PDF, activa el acceso a URL de archivo en los detalles de la extensión.",
    "configure-files": "Configurar acceso a archivos",
    "empty-sites": "No hay sitios añadidos. Abre otras páginas con el icono de la extensión.",
    "about-heading": "Acerca de L’Essentiel",
    "about-tagline": "Menos ruido. Más lectura.",
    "about-description":
      "Un espacio tranquilo para leer páginas web y PDF locales. Tus textos y preferencias se procesan en este dispositivo, sin cuenta ni sincronización.",
    "version-label": "Versión",
    "license-label": "Licencia",
    "privacy-heading": "Tus datos",
    "privacy-value": "En este dispositivo",
    "author-label": "Proyecto",
    "docs-link": "Documentación",
    "issues-link": "Informar un problema",
    "releases-link": "Notas de versión",
  },
};
async function refreshFileAccess() {
  const allowed = await browser.extension.isAllowedFileSchemeAccess();
  const locale = language.value;
  document.querySelector("#file-access-status")!.textContent =
    locale === "en"
      ? allowed
        ? "File access enabled"
        : "File access is disabled in the browser"
      : locale === "es"
        ? allowed
          ? "Acceso a archivos habilitado"
          : "El acceso a archivos está desactivado en el navegador"
        : allowed
          ? "Acesso a arquivos habilitado"
          : "Acesso a arquivos desativado no navegador";
  document.querySelector("#file-help")!.toggleAttribute("hidden", allowed);
}
document.querySelector("#configure-files")!.addEventListener("click", () => {
  const scheme = navigator.userAgent.includes("Edg/") ? "edge" : "chrome";
  void browser.tabs.create({ url: `${scheme}://extensions/?id=${browser.runtime.id}` });
});
window.addEventListener("focus", () => {
  void refreshFileAccess();
});
let sites: string[] = [];
type PermissionCalls = Pick<typeof browser.permissions, "request" | "contains" | "remove">;
const testPermissions = __MLA_TEST_MODE__ ? (window as Window & { __mlaTestPermissions?: PermissionCalls }).__mlaTestPermissions : undefined;
const permissions: PermissionCalls = testPermissions ?? browser.permissions;

function renderLanguage() {
  const t = translations[language.value as keyof typeof translations];
  document.documentElement.lang = language.value;
  document.title = `L’Essentiel — ${t.heading}`;
  document
    .querySelector("#project-links")!
    .setAttribute("aria-label", language.value === "en" ? "Project links" : language.value === "es" ? "Enlaces del proyecto" : "Links do projeto");
  document.querySelector("#heading")!.textContent = t.heading;
  document.querySelector("#sites-heading")!.textContent = t.sites;
  document.querySelector("#site-help")!.textContent = t.help;
  document.querySelector("#site-label")!.textContent = t.site;
  document.querySelector<HTMLButtonElement>("#add-site")!.textContent = t.add;
  document.querySelector<HTMLButtonElement>("#save")!.textContent = t.save;
  document.querySelector("#language-label")!.textContent = t.language;
  const extra = extraTranslations[language.value as keyof typeof extraTranslations];
  for (const [id, value] of Object.entries(extra)) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }
  localToggle.setAttribute("aria-label", extra["local-label"]);
  document.querySelector("#local-settings")!.toggleAttribute("hidden", !__READER_ENABLED__);
  void refreshFileAccess();
  renderSites();
}

function renderSites() {
  const removeLabel = translations[language.value as keyof typeof translations].remove;
  document.querySelector("#empty-sites")!.toggleAttribute("hidden", sites.length > 0);
  siteList.replaceChildren(
    ...sites.map((site) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = new URL(site.slice(0, -1)).origin;
      item.append(label);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary";
      button.textContent = `${removeLabel} ${new URL(site.slice(0, -1)).hostname}`;
      button.addEventListener("click", () => void removeSite(site));
      item.append(button);
      return item;
    }),
  );
}

async function removeSite(site: string) {
  if (!__READER_ENABLED__) return;
  if (!(await permissions.remove({ origins: [site] }))) return;
  sites = sites.filter((item) => item !== site);
  await browser.storage.local.set({ automaticSites: sites });
  renderSites();
}

document.querySelector<HTMLButtonElement>("#add-site")!.addEventListener("click", async () => {
  if (!__READER_ENABLED__) return;
  const t = translations[language.value as keyof typeof translations];
  const value = siteInput.value.trim();
  let url: URL;
  try {
    url = new URL(value.replace(/\/\*$/, ""));
  } catch {
    status.textContent = t.invalid;
    return;
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
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
  await browser.storage.local.set({
    readerPreferences: { ...preferences, language: language.value },
    ...(__READER_ENABLED__ ? { automaticLocalFiles: localToggle.checked } : {}),
  });
  status.textContent = translations[language.value as keyof typeof translations].saved;
});
language.addEventListener("change", renderLanguage);
void browser.storage.local
  .get(["readerPreferences", "automaticSites", "automaticLocalFiles"])
  .then(({ readerPreferences, automaticSites, automaticLocalFiles }) => {
    const locale = (readerPreferences as { language?: string } | undefined)?.language;
    language.value = locale === "en" || locale === "es" ? locale : "pt-BR";
    localToggle.checked = automaticLocalFiles !== false;
    sites = Array.isArray(automaticSites) ? (automaticSites as string[]) : [];
    renderLanguage();
  });
