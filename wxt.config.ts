import { defineConfig } from "wxt";
import { readFileSync } from "node:fs";

const testMode = process.env.MLA_TEST_MODE === "true";
const readerEnabled = process.env.MLA_FEATURE_READER === "true" || testMode;
const packageVersion = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version as string;

export default defineConfig({
  manifest: {
    name: "L’Essentiel",
    version_name: `${packageVersion}${process.env.BB_RC ? `-rc.${process.env.BB_RC}` : ""}`,
    description: "O essencial da sua leitura. Páginas web e PDFs locais, sem distrações.",
    default_locale: "pt_BR",
    permissions: ["activeTab", "scripting", "contextMenus", "storage"],
    // Test builds grant the synthetic page host so headless tests can exercise injection without browser UI gestures.
    host_permissions: readerEnabled ? [...(testMode ? ["http://*/*", "https://*/*"] : []), "file:///*"] : [],
    optional_host_permissions: ["http://*/*", "https://*/*"],
    web_accessible_resources: [{ resources: ["fonts/*.woff2"], matches: ["http://*/*", "https://*/*", "file:///*"] }],
    action: {
      default_title: "__MSG_actionTitle__",
      default_popup: "popup.html",
      default_icon: {
        16: "icons/light/icon-16.png",
        19: "icons/light/icon-19.png",
        32: "icons/light/icon-32.png",
        38: "icons/light/icon-38.png",
      },
    },
    options_ui: { page: "options.html", open_in_tab: true },
    icons: {
      16: "icons/light/icon-16.png",
      32: "icons/light/icon-32.png",
      48: "icons/light/icon-48.png",
      128: "icons/light/icon-128.png",
    },
    commands: {
      "activate-reader": {
        suggested_key: { default: "Alt+Shift+R" },
        description: "__MSG_activateReaderCommand__",
      },
    },
  },
  vite: () => ({ define: { __READER_ENABLED__: JSON.stringify(readerEnabled), __MLA_TEST_MODE__: JSON.stringify(testMode) } }),
});
