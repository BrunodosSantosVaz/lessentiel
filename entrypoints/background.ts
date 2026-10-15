import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

const contextMenuId = "activate-reader";
const readerScript = "content-scripts/reader.js";

export default defineBackground(() => {
  let contextMenuReady = false;
  const activateTab = async (tabId: number | undefined) => {
    if (tabId === undefined) return false;
    try {
      await browser.scripting.executeScript({ target: { tabId }, files: [readerScript] });
      return true;
    } catch {
      // Browser-internal pages and tabs without temporary access cannot run extension scripts.
      return false;
    }
  };

  const activateCurrentTab = async () => {
    const tabs = await browser.tabs.query({ currentWindow: true, active: true });
    const tab = tabs.find(({ url }) => url?.startsWith("http://") || url?.startsWith("https://"));
    return activateTab(tab?.id);
  };

  const menus = browser.contextMenus as unknown as {
    removeAll: (callback: () => void) => void;
    create: (properties: { id: string; title: string; contexts: ["page"] }, callback: () => void) => void;
  };
  const runtime = browser.runtime as unknown as { lastError?: { message?: string } };
  menus.removeAll(() => {
    menus.create({ id: contextMenuId, title: "Abrir no Leitor Limpo", contexts: ["page"] }, () => {
      contextMenuReady = runtime.lastError === undefined;
    });
  });

  browser.action.onClicked.addListener((tab) => activateTab(tab.id));
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
    if (message.type === "GET_CONTEXT_MENU_STATUS") {
      sendResponse(contextMenuReady);
      return false;
    }
    return false;
  });
});
