import { defineConfig } from "wxt";

const testMode = process.env.MLA_TEST_MODE === "true";
const readerEnabled = process.env.MLA_FEATURE_READER === "true" || testMode;

export default defineConfig({
  manifest: {
    name: "Leitor Limpo",
    description: "Leitura local e sem distrações para páginas web.",
    permissions: ["activeTab", "scripting", "contextMenus", "storage"],
    // Test builds grant the synthetic page host so headless tests can exercise injection without browser UI gestures.
    host_permissions: testMode ? ["http://*/*", "https://*/*"] : [],
    optional_host_permissions: ["http://*/*", "https://*/*"],
    web_accessible_resources: [{ resources: ["fonts/*.woff2"], matches: ["http://*/*", "https://*/*"] }],
    action: {
      default_title: "Abrir Leitor Limpo",
      default_popup: "popup.html",
      default_icon: {
        16: "icon-16.png",
        32: "icon-32.png",
        48: "icon-48.png",
        128: "icon-128.png",
      },
    },
    options_ui: { page: "options.html", open_in_tab: true },
    icons: {
      16: "icon-16.png",
      32: "icon-32.png",
      48: "icon-48.png",
      128: "icon-128.png",
    },
    commands: {
      "activate-reader": {
        suggested_key: { default: "Alt+Shift+R" },
        description: "Ativar ou fechar o modo de leitura",
      },
    },
  },
  vite: () => ({ define: { __READER_ENABLED__: JSON.stringify(readerEnabled), __MLA_TEST_MODE__: JSON.stringify(testMode) } }),
});
