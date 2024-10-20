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

assertEnvsAreSet(["CLOAK_ENCRYPTION_KEY", "IDENTITY_WORKSPACE_INVITATION_URL"]);

export const CLOAK_ENCRYPTION_KEY = process.env.CLOAK_ENCRYPTION_KEY;
export const IDENTITY_MFA_REQUIRED =
  process.env.IDENTITY_MFA_REQUIRED || "false";
export const IDENTITY_USER_VERIFICATION_REQUIRED =
  process.env.IDENTITY_USER_VERIFICATION_REQUIRED || "false";
export const IDENTITY_WORKSPACE_INVITATION_URL =
  process.env.IDENTITY_WORKSPACE_INVITATION_URL;
export const IDENTITY_WORKSPACE_INVITE_EXPIRATION =
  process.env.IDENTITY_WORKSPACE_INVITE_EXPIRATION || "1d";
