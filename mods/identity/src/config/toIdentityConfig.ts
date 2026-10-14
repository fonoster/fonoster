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
import { DEFAULT_AUTH, IdentityConfig } from "../exchanges/types";
import {
  AuthFeatures,
  IdentitySection,
  SmtpConfigSection,
  TwilioConfigSection
} from "./schemas";

type IdentityConfigInputs = {
  identity: IdentitySection;
  /** Public base URL, e.g. https://voice.acme.com. Used for issuer and invite links. */
  appUrl: string;
  /** Database used when identity.database is not set. */
  databaseUrl: string;
  encryptionKey: string;
  smtp?: SmtpConfigSection;
  twilio?: TwilioConfigSection;
  auth?: AuthFeatures;
};

function readKey(inline: string | undefined, path: string | undefined): string {
  if (inline !== undefined) {
    return inline;
  }
  const fullPath = resolve(process.cwd(), path as string);
  try {
    return readFileSync(fullPath, "utf8");
  } catch (e) {
    throw new Error(
      `unable to read identity key at ${fullPath}: ${(e as Error).message}`
    );
  }
}

const trimSlash = (url: string) => url.replace(/\/+$/, "");

/**
 * Builds the runtime IdentityConfig from validated config sections. Shared by
 * the apiserver (fonoster.yaml) and standalone Identity (identity.yaml).
 */
function toIdentityConfig(inputs: IdentityConfigInputs): IdentityConfig {
  const { identity, smtp, twilio } = inputs;
  const appUrl = trimSlash(inputs.appUrl);

  return {
    dbUrl: identity.database?.url ?? inputs.databaseUrl,
    issuer: identity.issuer ?? appUrl,
    audience: identity.audience,
    privateKey: readKey(identity.keys.privateKey, identity.keys.privateKeyPath),
    publicKey: readKey(identity.keys.publicKey, identity.keys.publicKeyPath),
    encryptionKey: inputs.encryptionKey,
    accessTokenExpiresIn: identity.tokens.accessTokenExpiresIn,
    refreshTokenExpiresIn: identity.tokens.refreshTokenExpiresIn,
    idTokenExpiresIn: identity.tokens.idTokenExpiresIn,
    workspaceInviteExpiration: identity.invites.expiration,
    workspaceInviteUrl: identity.invites.url ?? `${appUrl}/invites`,
    workspaceInviteFailUrl:
      identity.invites.failUrl ?? `${appUrl}/invites/failed`,
    contactVerificationRequired: identity.security.contactVerificationRequired,
    twoFactorAuthenticationRequired:
      identity.security.twoFactorAuthenticationRequired,
    smtpConfig: smtp
      ? {
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          sender: smtp.sender,
          auth: { user: smtp.user, pass: smtp.password }
        }
      : undefined,
    twilioSmsConfig: twilio
      ? {
          accountSid: twilio.accountSid,
          authToken: twilio.authToken,
          sender: twilio.phoneNumber
        }
      : undefined,
    // Validated by the schema; casts only bridge zod's inference under this
    // package's non-strict tsconfig.
    githubOauth2Config: identity.oauth2
      ?.github as IdentityConfig["githubOauth2Config"],
    auth: (inputs.auth ?? DEFAULT_AUTH) as IdentityConfig["auth"]
  };
}

export { toIdentityConfig, IdentityConfigInputs };
