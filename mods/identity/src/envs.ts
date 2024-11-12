/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { assertEnvsAreSet } from "@fonoster/common";

const e = process.env;

export const CLOAK_ENCRYPTION_KEY = e.CLOAK_ENCRYPTION_KEY;
export const IDENTITY_MFA_REQUIRED = e.IDENTITY_MFA_REQUIRED === "true";
export const IDENTITY_OAUTH2_GITHUB_CLIENT_ID =
  e.IDENTITY_OAUTH2_GITHUB_CLIENT_ID;
export const IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET =
  e.IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET;
export const IDENTITY_OAUTH2_GITHUB_ENABLED =
  e.IDENTITY_OAUTH2_GITHUB_ENABLED === "true";
export const IDENTITY_USER_VERIFICATION_REQUIRED =
  e.IDENTITY_USER_VERIFICATION_REQUIRED === "true";
export const IDENTITY_WORKSPACE_INVITATION_URL =
  e.IDENTITY_WORKSPACE_INVITATION_URL;
export const IDENTITY_WORKSPACE_INVITE_EXPIRATION =
  e.IDENTITY_WORKSPACE_INVITE_EXPIRATION || "1d";

assertEnvsAreSet(["CLOAK_ENCRYPTION_KEY", "IDENTITY_WORKSPACE_INVITATION_URL"]);

if (IDENTITY_USER_VERIFICATION_REQUIRED) {
  assertEnvsAreSet([
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER"
  ]);
}

if (IDENTITY_OAUTH2_GITHUB_ENABLED) {
  assertEnvsAreSet([
    "IDENTITY_OAUTH2_GITHUB_CLIENT_ID",
    "IDENTITY_OAUTH2_GITHUB_CLIENT_SECRET"
  ]);
}
