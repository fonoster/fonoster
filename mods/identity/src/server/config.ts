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
import { readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { IdentityConfig } from "../exchanges/types";

/**
 * Configuration for the standalone Identity service.
 *
 * The service is configured exclusively from a JSON configuration file — no
 * environment variables. The file path is taken from a `--config <path>` CLI
 * flag, defaulting to `./config/identity.json` relative to the working
 * directory.
 */
const keysSchema = z
  .object({
    privateKey: z.string().optional(),
    publicKey: z.string().optional(),
    privateKeyPath: z.string().optional(),
    publicKeyPath: z.string().optional()
  })
  .refine(
    (k) =>
      (k.privateKey || k.privateKeyPath) && (k.publicKey || k.publicKeyPath),
    {
      message: "keys must provide a private and public key, inline or by path"
    }
  );

const smtpSchema = z.object({
  host: z.string(),
  port: z.number(),
  secure: z.boolean().default(false),
  sender: z.string(),
  auth: z
    .object({ user: z.string().default(""), pass: z.string().default("") })
    .default({})
});

const identityServiceConfigSchema = z.object({
  server: z
    .object({
      bindAddr: z.string().default("0.0.0.0:50051"),
      httpBridgePort: z.number().default(9000)
    })
    .default({}),
  database: z.object({ url: z.string().min(1) }),
  encryptionKey: z.string().min(1),
  issuer: z.string().min(1),
  audience: z.string().min(1),
  keys: keysSchema,
  tokens: z
    .object({
      accessTokenExpiresIn: z.string().default("15m"),
      refreshTokenExpiresIn: z.string().default("30d"),
      idTokenExpiresIn: z.string().default("15m")
    })
    .default({}),
  security: z
    .object({
      contactVerificationRequired: z.boolean().default(false),
      twoFactorAuthenticationRequired: z.boolean().default(false)
    })
    .default({}),
  invite: z
    .object({
      url: z.string().default(""),
      failUrl: z.string().default(""),
      expiration: z.string().default("2d")
    })
    .default({}),
  appUrl: z.string().default(""),
  smtp: smtpSchema.optional(),
  oauth2: z
    .object({
      github: z.object({ clientId: z.string(), clientSecret: z.string() })
    })
    .optional(),
  defaultUser: z
    .object({
      name: z.string(),
      email: z.string().email(),
      password: z.string()
    })
    .optional()
});

type IdentityServiceConfig = z.infer<typeof identityServiceConfigSchema>;

function configPathFromArgv(argv: string[]): string {
  const i = argv.indexOf("--config");
  const fromFlag = i >= 0 ? argv[i + 1] : undefined;
  return resolve(process.cwd(), fromFlag ?? "./config/identity.json");
}

function readKey(inline: string | undefined, path: string | undefined): string {
  return inline ?? readFileSync(resolve(process.cwd(), path as string), "utf8");
}

/** Maps the file config into the `IdentityConfig` shape `buildIdentityService` expects. */
function toIdentityConfig(c: IdentityServiceConfig): IdentityConfig {
  return {
    dbUrl: c.database.url,
    issuer: c.issuer,
    audience: c.audience,
    privateKey: readKey(c.keys.privateKey, c.keys.privateKeyPath),
    publicKey: readKey(c.keys.publicKey, c.keys.publicKeyPath),
    encryptionKey: c.encryptionKey,
    accessTokenExpiresIn: c.tokens.accessTokenExpiresIn,
    refreshTokenExpiresIn: c.tokens.refreshTokenExpiresIn,
    idTokenExpiresIn: c.tokens.idTokenExpiresIn,
    workspaceInviteExpiration: c.invite.expiration,
    workspaceInviteUrl: c.invite.url,
    workspaceInviteFailUrl: c.invite.failUrl,
    contactVerificationRequired: c.security.contactVerificationRequired,
    twoFactorAuthenticationRequired: c.security.twoFactorAuthenticationRequired,
    smtpConfig: c.smtp,
    githubOauth2Config: c.oauth2?.github
  } as IdentityConfig;
}

/** Loads and validates the service configuration from the file, failing fast. */
function loadConfig(argv: string[] = process.argv) {
  const path = configPathFromArgv(argv);

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(
      `unable to read Identity config at ${path}: ${(e as Error).message}`
    );
  }

  const result = identityServiceConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `invalid Identity config at ${path}: ${fromError(result.error).toString()}`
    );
  }

  const config = result.data;
  return {
    bindAddr: config.server.bindAddr,
    httpBridgePort: config.server.httpBridgePort,
    appUrl: config.appUrl,
    defaultUser: config.defaultUser,
    identityConfig: toIdentityConfig(config)
  };
}

export { identityServiceConfigSchema, IdentityServiceConfig, loadConfig };
