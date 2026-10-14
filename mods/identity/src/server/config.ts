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
import { loadServiceConfig, logsSchema } from "@fonoster/common";
import { z } from "zod";
import {
  authFeaturesSchema,
  fromLegacyIdentityJson,
  identitySectionSchema,
  smtpSchema,
  toIdentityConfig,
  twilioSchema
} from "../config";

/**
 * Configuration for the standalone Identity service: identity.yaml (or
 * .jsonc/.json), found via --config, /opt/fonoster or ./config. Same layout as
 * fonoster.yaml: shared settings at the root, Identity's own under
 * `identity:`. No environment variables, except ${VAR} in database URLs
 * shared with the Postgres container. The original identity.json layout is
 * still accepted (translated, with a warning).
 */
const identityServiceConfigSchema = z
  .object({
    domain: z.string().min(1).optional(),
    /** Defaults to https://<domain>. */
    appUrl: z.string().min(1).optional(),
    server: z
      .object({
        bindAddr: z.string().default("0.0.0.0:50051"),
        httpBridgePort: z.number().int().positive().default(9000)
      })
      .default({}),
    logs: logsSchema,
    database: z.object({ url: z.string().min(1) }),
    encryption: z.object({ key: z.string().min(1) }),
    smtp: smtpSchema.optional(),
    twilio: twilioSchema.optional(),
    features: z.object({ auth: authFeaturesSchema }).default({}),
    identity: identitySectionSchema
  })
  .superRefine((config, ctx) => {
    if (!config.appUrl && !config.domain && !config.identity.issuer) {
      ctx.addIssue({
        code: "custom",
        path: ["domain"],
        message: "set domain (or appUrl, or identity.issuer)"
      });
    }
  });

type IdentityServiceConfig = z.infer<typeof identityServiceConfigSchema>;

const appUrlOf = (config: IdentityServiceConfig) =>
  config.appUrl ??
  (config.domain ? `https://${config.domain}` : (config.identity.issuer ?? ""));

/** Reads and validates the file only (no keys read), e.g. for provisioning. */
function loadConfigFile(argv: string[] = process.argv) {
  const config = loadServiceConfig({
    service: "identity",
    schema: identityServiceConfigSchema,
    argv,
    interpolatePaths: ["database.url", "identity.database.url"],
    migrate: fromLegacyIdentityJson,
    legacyEnvPrefixes: ["APISERVER_IDENTITY_"]
  });

  return {
    config,
    databaseUrl: config.identity.database?.url ?? config.database.url
  };
}

/** Loads and validates the service configuration from the file, failing fast. */
function loadConfig(argv: string[] = process.argv) {
  const { config, databaseUrl } = loadConfigFile(argv);
  const appUrl = appUrlOf(config);
  const owner = config.identity.owner;

  return {
    bindAddr: config.server.bindAddr,
    httpBridgePort: config.server.httpBridgePort,
    appUrl,
    logs: config.logs,
    databaseUrl,
    defaultUser: owner
      ? { name: owner.name, email: owner.email, password: owner.password }
      : undefined,
    identityConfig: toIdentityConfig({
      identity: config.identity,
      appUrl,
      databaseUrl: config.database.url,
      encryptionKey: config.encryption.key,
      smtp: config.smtp,
      twilio: config.twilio,
      auth: config.features.auth
    })
  };
}

export {
  identityServiceConfigSchema,
  IdentityServiceConfig,
  loadConfig,
  loadConfigFile
};
