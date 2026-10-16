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
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/500.css";
import "./styles/app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app";
import { AppRoutes } from "./app/routes";
import { ConfigError } from "./components/status/boot-error";
import { createClient } from "./lib/client";
import { createQueryClient } from "./lib/query";
import { readRuntimeConfig } from "./lib/runtime";

const root = createRoot(document.getElementById("root")!);
const runtime = readRuntimeConfig();

if (!runtime.ok) {
  root.render(<ConfigError error={runtime.error} />);
} else {
  const { apiUrl } = runtime.config;
  root.render(
    <StrictMode>
      <App
        apiUrl={apiUrl}
        client={createClient(apiUrl)}
        queryClient={createQueryClient()}
      >
        <AppRoutes />
      </App>
    </StrictMode>
  );
}
