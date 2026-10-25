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
/*
 * The dashboard from source in front of a running stack, for proving the real-stack cases
 * (mods/conformance/test/dashboard/prove.sh): the SPA's own origin proxies the API to
 * PROVE_API_URL with that origin, so a fault patched into the source is what the tests meet.
 */
import { defineConfig, mergeConfig, type Plugin } from "vite";
import base from "./vite.config";

// The stack over HTTPS; the proxy verifies its certificate against the generated CA
// (NODE_EXTRA_CA_CERTS, set by prove.sh).
const target = process.env.PROVE_API_URL ?? "https://localhost:16449";
const rule = {
  target,
  changeOrigin: true,
  ws: true,
  headers: { origin: target }
};

// The SPA's runtime config names its own origin as the API (served by the proxy below).
const configJs = (host: string | undefined) =>
  `window.__FONOSTER__ = ${JSON.stringify({ apiUrl: `http://${host}` })};\n`;

const selfAsApi = (): Plugin => ({
  name: "prove-api-origin",
  configurePreviewServer(server) {
    server.middlewares.use("/config.js", (req, res) => {
      res.setHeader("content-type", "text/javascript");
      res.end(configJs(req.headers.host));
    });
  }
});

export default mergeConfig(
  base,
  defineConfig({
    plugins: [selfAsApi()],
    // A production build behind `vite preview`: the dev server reloads the page while it
    // optimizes dependencies, which made the first test of a run flaky.
    preview: { proxy: { "^/fonoster\\.": rule, "/api": rule, "/sip": rule } }
  })
);
