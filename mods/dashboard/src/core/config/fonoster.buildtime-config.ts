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

export interface BuildTimeConfig {
  VERSION: string;
  RESET_PASSWORD_URL: string;
  GITHUB_OAUTH: {
    clientId: string;
    callbackUrl: string;
    authUrl: string;
  };
}

export const BUILD_TIME_CONFIG: BuildTimeConfig = {
  VERSION: import.meta.env.DASHBOARD_VERSION || "unset",
  RESET_PASSWORD_URL:
    import.meta.env.DASHBOARD_RESET_PASSWORD_URL ||
    "https://app.fonoster.com/auth/reset-password",
  GITHUB_OAUTH: {
    clientId: import.meta.env.DASHBOARD_AUTH_GITHUB_CLIENT_ID || "",
    callbackUrl: import.meta.env.DASHBOARD_AUTH_GITHUB_CALLBACK_URL || "",
    authUrl: import.meta.env.DASHBOARD_AUTH_GITHUB_URL || ""
  }
};
