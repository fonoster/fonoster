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
import { IdentityConfig } from "../exchanges/types";
import { isMethodEnabled } from "../utils/authMethods";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

type GetCapabilitiesResponse = {
  auth: {
    methods: string[];
    signup: string;
    github?: { clientId: string; authorizeUrl: string };
  };
  product: Record<string, string>;
};

/**
 * What this deployment supports, for clients that render sign-in and
 * product features from it. Public, so it must never include a secret: only
 * the GitHub client id is exposed, never the client secret.
 */
function createGetCapabilities(identityConfig: IdentityConfig) {
  const { auth, githubOauth2Config, capabilities } = identityConfig;
  const github =
    isMethodEnabled(identityConfig, "github") && githubOauth2Config
      ? {
          clientId: githubOauth2Config.clientId,
          authorizeUrl: GITHUB_AUTHORIZE_URL
        }
      : undefined;

  const response: GetCapabilitiesResponse = {
    auth: {
      // github is listed only when it can actually be used.
      methods: auth.methods.filter((m) => m !== "github" || github),
      signup: auth.signup,
      github
    },
    product: { ...(capabilities ?? {}) }
  };

  return async (
    _call: unknown,
    callback: (error: null, response: GetCapabilitiesResponse) => void
  ) => callback(null, response);
}

export { createGetCapabilities, GetCapabilitiesResponse };
