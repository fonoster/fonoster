/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// The SDK's "module" field names a file it doesn't ship, so point straight at
// its browser build.
const sdkWeb = join(
  dirname(createRequire(import.meta.url).resolve("@fonoster/sdk/package.json")),
  "dist/web/index.esm.js"
);

// In the dev container (npm run dev:dashboard) the API's URL comes from DASHBOARD_API_URL, as in
// the image (nginx/40-fonoster-config.sh); without it public/config.js is served.
const runtimeConfigFromEnv = (): Plugin => ({
  name: "fonoster-runtime-config",
  configureServer(server) {
    const apiUrl = process.env.DASHBOARD_API_URL;
    if (!apiUrl) return;
    server.middlewares.use("/config.js", (_req, res) => {
      res.setHeader("content-type", "text/javascript");
      res.end(`window.__FONOSTER__ = ${JSON.stringify({ apiUrl })};\n`);
    });
  }
});

export default defineConfig({
  plugins: [react(), tailwindcss(), runtimeConfigFromEnv()],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
      "@fonoster/sdk": sdkWeb
    },
    dedupe: ["react", "react-dom"]
  },
  server: { port: 3030, strictPort: true },
  preview: { port: 3030, strictPort: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    css: false
  }
});
