import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

const contextMenuId = "activate-reader";
const readerScript = "content-scripts/reader.js";

export default defineBackground(() => {
  let contextMenuReady = false;
  const activateTab = async (tabId: number | undefined) => {
    if (!__READER_ENABLED__) return false;
    if (tabId === undefined) return false;
    try {
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
    const tab = tabs.find(({ url }) => url?.startsWith("http://") || url?.startsWith("https://"));
    return activateTab(tab?.id);
  };

  const menuTitles = { "pt-BR": "Abrir no Leitor Limpo", en: "Open in Leitor Limpo", es: "Abrir en Leitor Limpo" };
  const menus = browser.contextMenus as unknown as {
    removeAll: (callback: () => void) => void;
    create: (properties: { id: string; title: string; contexts: ["page"] }, callback: () => void) => void;
  };
  const runtime = browser.runtime as unknown as { lastError?: { message?: string } };
  const refreshContextMenu = async () => {
    const { readerPreferences } = await browser.storage.local.get("readerPreferences");
    const language = (readerPreferences as { language?: string } | undefined)?.language;
    menus.removeAll(() => {
      menus.create(
        {
          id: contextMenuId,
          title: menuTitles[language === "en" || language === "es" ? language : "pt-BR"],
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

  browser.action.onClicked.addListener((tab) => activateTab(tab.id));
  browser.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (change.status === "complete") void activateIfAllowed(tabId, tab.url);
  });
  browser.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await browser.tabs.get(tabId);
    void activateIfAllowed(tabId, tab.url);
  });
  browser.commands.onCommand.addListener((command) => {
    if (command === "activate-reader") void activateCurrentTab();
  });
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === contextMenuId) void activateTab(tab?.id);
  });
  const runtimeMessaging = browser.runtime as unknown as {
    onMessage: {
      addListener: (listener: (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean) => void;
    };
  };
  runtimeMessaging.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== "object" || !("type" in message)) return false;
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
