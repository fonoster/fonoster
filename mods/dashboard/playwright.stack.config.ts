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

// The dashboard against the running local stack (ops/rebuild/stack), not the gRPC-web mock:
// `ops/rebuild/stack billing-page-e2e` starts the stack with billing and runs this.
export default defineConfig({
  testDir: "./e2e-stack",
  timeout: 120_000,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.RB_DASHBOARD_URL ?? "http://localhost:16449",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"]
  }
});
