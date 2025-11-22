// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    {
      name: "userscript-bundler",
      apply: "build",
      enforce: "post",
      async generateBundle(_, bundle) {
        // find the entry
        const entries = Object.entries(bundle).filter(
          ([_, content]) => content.type === "chunk" && content.isEntry
        );
        if (entries.length === 0) {
          this.warn("[userscript-bundler] cannot find entry for the userscript");
          return;
        }
        if (entries.length > 1) {
          this.warn(
            "[userscript-bundler] multiple entries existing, please check. They are:\n" +
              entries.map(([_, content]) => content.fileName).join("\n")
          );
          return;
        }
        // collect chunks by imported order
        const parsed_chunks = new Set<string>();
        const collected_chunks: Array<{ name: string; code: string }> = [];
        const collectChunk = (file_name: string) => {
          if (parsed_chunks.has(file_name)) {
            return;
          }
          parsed_chunks.add(file_name);
          const item = bundle[file_name];
          if (item === undefined) {
            this.warn(`${file_name} referred but not found in bundle`);
            return;
          }
          if (item.type === "chunk") {
            const imports = item.imports.concat(item.dynamicImports);
            imports.forEach(collectChunk);
            collected_chunks.push({ name: file_name, code: item.code });
          } else {
            collected_chunks.push({ name: file_name, code: `/* asset ${file_name} */\n${item.source}` });
          }
        };
        collectChunk(entries[0][0]);
        const entry_file_path = (() => {
          const data = entries[0][1];
          if (data.type === "asset") {
            return data.originalFileNames[0] ?? "";
          }
          return data.facadeModuleId ?? "";
        })();
        // find header from the entry file
        const src = readFileSync(entry_file_path, "utf8");
        const match = src.match(/(\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==\s*)/);
        const header = match ? match[1] : "";
        // merge chunks
        const final_code = [
          header,
          ...collected_chunks.map(({ name, code }) => `// ---- chunk: ${name} ----\n${code}`),
        ].join("\n");
        for (const { name } of collected_chunks) {
          if (bundle[name]) delete bundle[name];
        }
        this.emitFile({
          type: "asset",
          fileName: "wt-injector.user.js",
          source: final_code,
        });
      },
    },
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  build: {
    outDir: "dist-userscript",
    lib: {
      entry: "./src/extension/entry.ts",
      name: "wt-injector",
      formats: ["es"],
    },
    rollupOptions: {
      input: {
        userscript: "./src/extension/entry.ts",
      },
    },
    minify: "terser",
  },
}));
