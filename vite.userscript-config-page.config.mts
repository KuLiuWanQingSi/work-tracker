// Plugins
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import Fonts from "unplugin-fonts/vite";
import Layouts from "vite-plugin-vue-layouts-next";
import Vue from "@vitejs/plugin-vue";
import VueRouter from "unplugin-vue-router/vite";
import { VueRouterAutoImports } from "unplugin-vue-router";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import vueDevTools from "vite-plugin-vue-devtools";

// Utilities
import { defineConfig, PluginOption } from "vite";
import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";

const EntryPath = "src/extension/index.html";

// some of the plugins are for developing purpose and should not be included into release build
function get_plugins(command: "serve" | "build"): PluginOption[] {
  const plugins: PluginOption[] = [
    Vue({
      template: { transformAssetUrls },
    }),
    Vuetify(),
    {
      name: "index-replacer",
      apply: "build",
      enforce: "post",
      async generateBundle(_, bundle) {
        const index = bundle[EntryPath];
        if (index === undefined) {
          this.error("[index-replacer] cannot find index.html!");
        }
        if (index.type !== "asset") {
          this.error("[index-replacer] index.html is supposed to be an asset!");
          return;
        }
        this.emitFile({ type: "asset", fileName: "index.html", source: index.source });
        delete bundle[EntryPath];
      },
    },
  ];
  if (command === "serve") {
    plugins.push(vueDevTools());
  }
  return plugins;
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: "/wt-injector/",
  plugins: get_plugins(command),
  optimizeDeps: {
    exclude: [
      "vuetify",
      "vue-router",
      "unplugin-vue-router/runtime",
      "unplugin-vue-router/data-loaders",
      "unplugin-vue-router/data-loaders/basic",
    ],
  },
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  build: {
    outDir: "dist-userscript",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        index: EntryPath,
      },
    },
    minify: "terser",
  },
}));
