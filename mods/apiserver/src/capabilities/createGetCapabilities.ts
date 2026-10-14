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
import { FonosterConfig, getAppUrl } from "../config";

type GetCapabilitiesResponse = {
  auth: {
    methods: string[];
    signup: string;
    github?: { clientId: string; authorizeUrl: string };
  };
  billing: { enabled: boolean };
  costs: { display: string };
  domain: string;
  appUrl: string;
};

/**
 * What this deployment supports, from fonoster.yaml, for clients that render
 * sign-in and product features from it. Public, so it must never include a
 * secret: only the GitHub client id is exposed, never the client secret.
 */
function createGetCapabilities(config: FonosterConfig) {
  const { auth, billing, costs } = config.features;
  const githubOAuth = config.identity.oauth2?.github;
  const github =
    auth.methods.includes("github") && githubOAuth
      ? {
          clientId: githubOAuth.clientId,
          authorizeUrl: `${githubOAuth.url}/login/oauth/authorize`
        }
      : undefined;

  const response: GetCapabilitiesResponse = {
    auth: {
      methods: [...auth.methods],
      signup: auth.signup,
      github
    },
    billing: { enabled: billing.enabled },
    costs: { display: costs.display },
    domain: config.domain,
    appUrl: getAppUrl(config)
  };

  return async (
    _call: unknown,
    callback: (error: null, response: GetCapabilitiesResponse) => void
  ) => callback(null, response);
}

export { createGetCapabilities, GetCapabilitiesResponse };
