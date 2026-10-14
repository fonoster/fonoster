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
import { loadServiceConfig, strictDeep } from "@fonoster/common";
import { IdentityConfig, toIdentityConfig } from "@fonoster/identity";
import {
  FonosterConfig,
  fonosterConfigSchema,
  MOVED_KEYS,
  SHARED_VALUE_PATHS
} from "./schema";

let loaded: FonosterConfig | undefined;
let identityConfig: IdentityConfig | undefined;

/**
 * The API server's configuration, read once from fonoster.yaml (or .jsonc).
 * The file is found via --config, /opt/fonoster or ./config.
 */
function getConfig(): FonosterConfig {
  if (!loaded) {
    loaded = loadServiceConfig({
      service: "apiserver",
      fileBase: "fonoster",
      schema: fonosterConfigSchema,
      interpolatePaths: SHARED_VALUE_PATHS,
      movedKeys: MOVED_KEYS,
      legacyEnvPrefixes: ["APISERVER_", "AUTOPILOT_"]
    });
  }
  return loaded;
}

/**
 * Replaces the configuration for tests. Validated like a file, so defaults
 * apply. Must run before anything imports envs.ts.
 */
function setConfigForTests(raw: unknown) {
  loaded = strictDeep(fonosterConfigSchema).parse(raw);
  identityConfig = undefined;
}

const trimSlash = (url: string) => url.replace(/\/+$/, "");

/** Base URL for links in emails. */
function getAppUrl(config: FonosterConfig = getConfig()) {
  return trimSlash(config.appUrl ?? `https://${config.domain}`);
}

/** WebRTC signaling server for browser test calls. */
function getSignalingServer(config: FonosterConfig = getConfig()) {
  return config.signalingServer ?? `wss://${config.domain}:5062`;
}

/** Runtime Identity configuration (reads the signing keys once). */
function getIdentityConfig(): IdentityConfig {
  if (!identityConfig) {
    const config = getConfig();
    identityConfig = toIdentityConfig({
      identity: config.identity,
      appUrl: getAppUrl(config),
      databaseUrl: config.database.url,
      encryptionKey: config.encryption.key,
      smtp: config.smtp,
      twilio: config.twilio,
      auth: config.features.auth
    });
  }
  return identityConfig;
}

export {
  FonosterConfig,
  getAppUrl,
  getConfig,
  getIdentityConfig,
  getSignalingServer,
  setConfigForTests
};
export * from "./schema";
