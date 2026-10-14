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
  encryptionKeySchema,
  invitesSchema,
  keysSchema,
  oauth2Schema,
  ownerSchema,
  securitySchema,
  smtpSchema,
  toIdentityConfig,
  tokensSchema,
  twilioSchema
} from "../config";

/**
 * Configuration for the standalone Identity service: identity.json (or
 * .jsonc/.yaml), found via --config, /opt/fonoster or ./config. Fields sit at
 * the root of the file, as they always have; the same settings live under
 * fonoster.yaml's `identity:` section when Identity is embedded in the API
 * server. No environment variables, except ${VAR} in the database URL shared
 * with the Postgres container.
 */
const identityServiceConfigSchema = z.object({
  server: z
    .object({
      bindAddr: z.string().default("0.0.0.0:50051"),
      httpBridgePort: z.number().int().positive().default(9000)
    })
    .default({}),
  logs: logsSchema,
  database: z.object({ url: z.string().min(1) }),
  encryptionKey: encryptionKeySchema,
  issuer: z.string().min(1),
  audience: z.string().min(1).default("api"),
  /** Where the accept-invite bridge redirects. Defaults to the issuer. */
  appUrl: z.string().min(1).optional(),
  keys: keysSchema,
  tokens: tokensSchema,
  security: securitySchema,
  invite: invitesSchema,
  smtp: smtpSchema
    .omit({ user: true, password: true })
    .extend({
      auth: z
        .object({ user: z.string().default(""), pass: z.string().default("") })
        .default({})
    })
    .optional(),
  twilio: twilioSchema.optional(),
  oauth2: oauth2Schema,
  features: z.object({ auth: authFeaturesSchema }).default({}),
  defaultUser: ownerSchema
});

type IdentityServiceConfig = z.infer<typeof identityServiceConfigSchema>;

/** Reads and validates the file only (no keys read), e.g. for provisioning. */
function loadConfigFile(argv: string[] = process.argv) {
  const config = loadServiceConfig({
    service: "identity",
    schema: identityServiceConfigSchema,
    argv,
    interpolatePaths: ["database.url"],
    legacyEnvPrefixes: ["APISERVER_IDENTITY_"]
  });

  return { config, databaseUrl: config.database.url };
}

/** Loads and validates the service configuration from the file, failing fast. */
function loadConfig(argv: string[] = process.argv) {
  const { config, databaseUrl } = loadConfigFile(argv);
  const appUrl = config.appUrl ?? config.issuer;
  const smtp = config.smtp;

  return {
    bindAddr: config.server.bindAddr,
    httpBridgePort: config.server.httpBridgePort,
    appUrl,
    logs: config.logs,
    databaseUrl,
    defaultUser: config.defaultUser,
    identityConfig: toIdentityConfig({
      identity: {
        issuer: config.issuer,
        audience: config.audience,
        keys: config.keys,
        tokens: config.tokens,
        security: config.security,
        invites: config.invite,
        oauth2: config.oauth2,
        owner: config.defaultUser
      },
      appUrl,
      databaseUrl,
      encryptionKey: config.encryptionKey,
      smtp: smtp
        ? {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            sender: smtp.sender,
            user: smtp.auth.user,
            password: smtp.auth.pass
          }
        : undefined,
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
