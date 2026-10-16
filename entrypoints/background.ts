import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

const contextMenuId = "activate-reader";
const readerScript = "content-scripts/reader.js";

export default defineBackground(() => {
  let contextMenuReady = false;
  const openLocalPdf = async (tabId: number, url: string) => {
    if (!(await browser.extension.isAllowedFileSchemeAccess())) return false;
    const target = new URL((browser.runtime as typeof browser.runtime & { getURL: (path: string) => string }).getURL("/pdf.html"));
    target.searchParams.set("source", url);
    await browser.tabs.update(tabId, { url: target.href });
    return true;
  };
  const isLocalPdf = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "file:" && /\.pdf$/i.test(parsed.pathname);
    } catch {
      return false;
    }
  };
  const originalPdf = (url: string) => {
    try {
      const parsed = new URL(url);
      const readerUrl = new URL((browser.runtime as typeof browser.runtime & { getURL: (path: string) => string }).getURL("/pdf.html"));
      const source = parsed.searchParams.get("source");
      return parsed.protocol === readerUrl.protocol && parsed.host === readerUrl.host && parsed.pathname === readerUrl.pathname && source && isLocalPdf(source)
        ? source
        : null;
    } catch {
      return null;
    }
  };
  const activateTab = async (tabId: number | undefined, url?: string) => {
    if (!__READER_ENABLED__) return false;
    if (tabId === undefined) return false;
    try {
      const original = url && originalPdf(url);
      if (original) {
        await browser.tabs.update(tabId, { url: original });
        return true;
      }
      if (url && isLocalPdf(url)) return await openLocalPdf(tabId, url);
      await browser.scripting.executeScript({ target: { tabId }, files: [readerScript] });
      return true;
    } catch {
      // Browser-internal pages and tabs without temporary access cannot run extension scripts.
      return false;
    }
  };

  const activateIfAllowed = async (tabId: number | undefined, url?: string) => {
    if (!__READER_ENABLED__ || tabId === undefined || !url) return;
    const { automaticSites = [] } = await browser.storage.local.get("automaticSites");
    const site = (automaticSites as string[]).find((pattern) => url.startsWith(pattern.slice(0, -1)));
    if (site && (await browser.permissions.contains({ origins: [site] }))) await activateTab(tabId);
  };

  const activateCurrentTab = async () => {
    const tabs = await browser.tabs.query({ currentWindow: true, active: true });
    const tab = tabs.find(({ url }) => url && (/^(https?|file):/.test(url) || originalPdf(url)));
    return activateTab(tab?.id, tab?.url);
  };

  const menuTitles = { "pt-BR": "Abrir no L’Essentiel", en: "Open in L’Essentiel", es: "Abrir en L’Essentiel" };
  const actionTitles = { "pt-BR": "Abrir L’Essentiel", en: "Open L’Essentiel", es: "Abrir L’Essentiel" };
  const menus = browser.contextMenus as unknown as {
    removeAll: (callback: () => void) => void;
    create: (properties: { id: string; title: string; contexts: ["page"] }, callback: () => void) => void;
  };
  const runtime = browser.runtime as unknown as { lastError?: { message?: string } };
  const refreshContextMenu = async () => {
    const { readerPreferences } = await browser.storage.local.get("readerPreferences");
    const language = (readerPreferences as { language?: string } | undefined)?.language;
    const locale = language === "en" || language === "es" ? language : "pt-BR";
    await browser.action.setTitle({ title: actionTitles[locale] });
    menus.removeAll(() => {
      menus.create(
        {
          id: contextMenuId,
          title: menuTitles[locale],
          contexts: ["page"],
        },
        () => {
          contextMenuReady = runtime.lastError === undefined;
        },
      );
    });
  };
  void refreshContextMenu();
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.readerPreferences) void refreshContextMenu();
  });

  browser.action.onClicked.addListener((tab) => activateTab(tab.id, tab.url));
  browser.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (change.status !== "complete") return;
    if (tab.url && isLocalPdf(tab.url)) return;
    if (tab.url?.startsWith("file:")) {
      void (async () => {
        const { automaticLocalFiles = true } = await browser.storage.local.get("automaticLocalFiles");
        if (automaticLocalFiles && (await browser.extension.isAllowedFileSchemeAccess())) await activateTab(tabId, tab.url);
      })();
    } else void activateIfAllowed(tabId, tab.url);
  });
  browser.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await browser.tabs.get(tabId);
    void activateIfAllowed(tabId, tab.url);
  });
  browser.commands.onCommand.addListener((command) => {
    if (command === "activate-reader") void activateCurrentTab();
  });
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === contextMenuId) void activateTab(tab?.id, tab?.url);
  });
  const runtimeMessaging = browser.runtime as unknown as {
    onMessage: {
      addListener: (
        listener: (message: unknown, sender: { tab?: { id?: number }; url?: string }, sendResponse: (response: unknown) => void) => boolean,
      ) => void;
    };
  };
  runtimeMessaging.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== "object" || !("type" in message)) return false;
    if (message.type === "RETURN_TO_PDF" && "url" in message && typeof message.url === "string") {
      const url = message.url;
      const tabId = sender.tab?.id;
      if (tabId === undefined || !sender.url || originalPdf(sender.url) !== url) return false;
      void browser.tabs.update(tabId, { url }).then(() => sendResponse(true));
      return true;
    }
    if (message.type === "ACTIVATE_READER") {
      void activateCurrentTab().then(sendResponse);
      return true;
    }
    if (message.type === "OPEN_OPTIONS") {
      void browser.runtime.openOptionsPage();
      sendResponse(true);
      return false;
    }
    if (message.type === "GET_CONTEXT_MENU_STATUS") {
      sendResponse(contextMenuReady);
      return false;
    }
    return false;
  });
});
