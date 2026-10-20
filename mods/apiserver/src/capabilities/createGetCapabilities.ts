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
  regions: { private: boolean };
  connection: ConnectionCapabilities;
  sip: { names: string };
};

type ConnectionCapabilities = {
  sip: { host: string; port: number; transport: string }[];
  signalingAddresses: string[];
  mediaAddresses: string[];
  rtpPorts?: { min: number; max: number };
};

/**
 * Private regions are an optional integration: enrollment needs both the
 * region-signing key and the region hub (regions.signingKey + regions.hub,
 * the same pair runRegions checks). Only the boolean is exposed, never the
 * hub URL, credentials or key.
 */
function supportsPrivateRegions(config: FonosterConfig): boolean {
  return Boolean(config.regions?.signingKey && config.regions?.hub);
}

/**
 * Where carriers and softphones reach this deployment: the default public
 * region's endpoints (regions.public), the same ones the regions API reported.
 * Always served, so the trunk and SIP agent hints work without private regions.
 * Addresses and ports only.
 */
function connectionDetails(config: FonosterConfig): ConnectionCapabilities {
  const publicRegions = config.regions?.public ?? [];
  const region = publicRegions.find((r) => r.default) ?? publicRegions[0];
  const e = region?.endpoints;
  return {
    sip: (e?.sip ?? []).map(({ host, port, transport }) => ({
      host,
      port,
      transport
    })),
    signalingAddresses: [...(e?.signalingAddresses ?? [])],
    mediaAddresses: [...(e?.mediaAddresses ?? [])],
    rtpPorts: e?.rtpPorts
      ? { min: e.rtpPorts.min, max: e.rtpPorts.max }
      : undefined
  };
}

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
    appUrl: getAppUrl(config),
    regions: { private: supportsPrivateRegions(config) },
    connection: connectionDetails(config),
    sip: { names: config.features.sip.names }
  };

  return async (
    _call: unknown,
    callback: (error: null, response: GetCapabilitiesResponse) => void
  ) => callback(null, response);
}

export {
  connectionDetails,
  createGetCapabilities,
  GetCapabilitiesResponse,
  supportsPrivateRegions
};
