/*
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

const { origin, hostname, port } = new URL(
  import.meta.env.DASHBOARD_API_URL || "https://api.fonoster.com"
);

export const FONOSTER_CLIENT_CONFIG = Object.freeze({
  url: origin,
  accessKeyId: "",
  allowInsecure: Boolean(import.meta.env.DASHBOARD_ALLOW_INSECURE === "true")
});

export const FONOSTER_SERVER_CONFIG = Object.freeze({
  endpoint: `${hostname}${port ? `:${port}` : ""}`,
  accessKeyId: "",
  allowInsecure: Boolean(import.meta.env.DASHBOARD_ALLOW_INSECURE === "true"),
  accessToken: ""
});

export const FONOSTER_RESET_PASSWORD_URL: string =
  import.meta.env.DASHBOARD_RESET_PASSWORD_URL ||
  "https://app.fonoster.com/auth/reset-password";

export const IS_CLOUD = Boolean(import.meta.env.DASHBOARD_EDITION === "cloud");
