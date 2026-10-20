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
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The viewer (add-stripe-fake D7), built into viewer/dist and served by the fake at `/`. In
// development (`vite --config viewer/vite.config.ts`) the API and the live updates go to a fake
// on STRIPE_FAKE_URL (default http://localhost:12111).
const target = process.env.STRIPE_FAKE_URL ?? "http://localhost:12111";

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 12112,
    proxy: {
      "/_fake/ws": { target: target.replace(/^http/, "ws"), ws: true },
      "/_fake": target,
      "/v1": target
    }
  }
});
