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
const getEnvString = (moduleKey: string, serverKey: string, defaultValue?: string): string => {
  return process.env[moduleKey] || process.env[serverKey] || defaultValue || "";
};

const getEnvBoolean = (moduleKey: string, serverKey: string, defaultValue = false): boolean => {
  const moduleValue = process.env[moduleKey];
  const serverValue = process.env[serverKey];
  return moduleValue === "true" || serverValue === "true" || defaultValue;
};

export const CLOAK_ENCRYPTION_KEY = getEnvString(
  "CLOAK_ENCRYPTION_KEY",
  "APISERVER_CLOAK_ENCRYPTION_KEY"
);

export const IDENTITY_MFA_REQUIRED = getEnvBoolean(
  "IDENTITY_MFA_REQUIRED",
  "APISERVER_IDENTITY_MFA_REQUIRED"
);

export const IDENTITY_OAUTH2_GITHUB_CLIENT_ID = getEnvString(
  "IDENTITY_OAUTH2_GITHUB_CLIENT_ID",
  "APISERVER_IDENTITY_OAUTH2_GITHUB_CLIENT_ID"
);

export const IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET = getEnvString(
  "IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET",
  "APISERVER_IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET"
);

export const IDENTITY_USER_VERIFICATION_REQUIRED = getEnvBoolean(
  "IDENTITY_USER_VERIFICATION_REQUIRED",
  "APISERVER_IDENTITY_USER_VERIFICATION_REQUIRED"
);

export const IDENTITY_WORKSPACE_INVITATION_URL = getEnvString(
  "IDENTITY_WORKSPACE_INVITATION_URL",
  "APISERVER_IDENTITY_WORKSPACE_INVITATION_URL"
);

export const IDENTITY_WORKSPACE_INVITE_EXPIRATION = getEnvString(
  "IDENTITY_WORKSPACE_INVITE_EXPIRATION",
  "APISERVER_IDENTITY_WORKSPACE_INVITE_EXPIRATION",
  "1d"
);
