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
import type { Capabilities } from "./client";

/** Self-hosted defaults: email and password, invite-only. */
export const communityCapabilities: Capabilities = {
  auth: { methods: ["password"], signup: "invite" },
  billing: { enabled: false },
  costs: { display: "none" },
  domain: "fonoster.local",
  appUrl: "http://localhost:3030",
  regions: { private: false }
};

/** Fonoster Cloud: GitHub and emailed codes, open sign-up, billing. */
export const cloudCapabilities: Capabilities = {
  auth: {
    methods: ["github", "email_code"],
    signup: "open",
    github: {
      clientId: "Iv1.fakeclientid",
      authorizeUrl: "https://github.com/login/oauth/authorize"
    }
  },
  billing: { enabled: true },
  costs: { display: "prices" },
  domain: "fonoster.com",
  appUrl: "https://app.fonoster.com",
  regions: { private: true }
};

/** Self-hosted with the region hub added: private regions on, billing off. */
export const regionsCapabilities: Capabilities = {
  ...communityCapabilities,
  regions: { private: true }
};
