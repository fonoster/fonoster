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
import { reactRouter } from "@react-router/dev/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/** Leave CJS react-dom unbundled so __DOM_INTERNALS.d exists during SSR. */
function ssrNativeReact(): Plugin {
  const native = new Set([
    "react",
    "react-dom",
    "react-dom/client",
    "react-dom/server",
    "react/jsx-runtime",
    "react/jsx-dev-runtime"
  ]);
  return {
    name: "ssr-native-react",
    enforce: "pre",
    resolveId(id, _importer, options) {
      if (options?.ssr && native.has(id)) {
        return { id, external: true };
      }
      return undefined;
    }
  };
}

export default defineConfig({
  plugins: [ssrNativeReact(), reactRouter(), tsconfigPaths()],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime"
    ]
  },
  // Do not ssr.noExternal MUI/Emotion: Vite then ESM-interops react-dom and
  // ReactDOM.__DOM_INTERNALS is missing → "Cannot read properties of undefined (reading 'd')".
  optimizeDeps: {
    include: ["@emotion/react", "@emotion/styled", "@emotion/cache", "@mui/material"]
  },
  server: {
    host: "127.0.0.1",
    port: 3030,
    strictPort: true,
    preTransformRequests: false,
    watch: {
      ignored: ["**/node_modules/**", "**/.git/**"]
    },
    proxy: {
      "^/fonoster\\.": {
        target: "https://fonoster.intelli-verse-x.ai",
        changeOrigin: true,
        secure: true
      }
    }
  },
  envPrefix: "DASHBOARD_"
});
