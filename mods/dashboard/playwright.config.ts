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
import { defineConfig, devices } from "@playwright/test";
import type { Variant } from "./e2e/fixtures";

const PORT = Number(process.env.E2E_PORT ?? 4174);
// The `real` project runs against a running platform (ops/rebuild/stack up && seed), not the
// mocked preview: E2E_REAL_URL is the dashboard's URL, E2E_REAL_EMAIL / E2E_REAL_PASSWORD the
// owner's sign-in, E2E_REAL_APP the seeded agent's name. `npm run test:e2e:real` sets them from
// the stack's files.
const REAL_URL = process.env.E2E_REAL_URL;
const realProject = {
  name: "real",
  testMatch: /\.real\.spec\.ts$/,
  use: {
    variant: "community" as Variant,
    baseURL: REAL_URL,
    // E2E_REAL_URL may be the stack behind HTTPS with a self-signed certificate (DSH-063, the
    // WSS path); http:// ignores this.
    ignoreHTTPSErrors: true,
    // A fake microphone, granted without a prompt: the talk drawer needs getUserMedia.
    launchOptions: {
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream"
      ]
    }
  }
};

export default defineConfig<{ variant: Variant }>({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"]
  },
  projects: [
    { name: "community", testMatch: /community\.spec\.ts/, use: { variant: "community" } },
    { name: "cloud", testMatch: /cloud\.spec\.ts/, use: { variant: "cloud" } },
    // Only against a running platform; otherwise the suite is the two mocked projects.
    ...(REAL_URL ? [realProject] : [])
  ],
  webServer: REAL_URL ? undefined : {
    command: `npx vite build --logLevel warn && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
