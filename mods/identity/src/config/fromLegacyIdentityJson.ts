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
import { getLogger } from "@fonoster/logger";

const logger = getLogger({ service: "identity", filePath: __filename });

type Raw = Record<string, unknown>;

const LEGACY_MARKERS = [
  "encryptionKey",
  "defaultUser",
  "invite",
  "issuer",
  "keys"
];

/** True for the original identity.json layout (no `identity:` section). */
function isLegacyIdentityJson(input: unknown): boolean {
  if (input === null || typeof input !== "object" || "identity" in input) {
    return false;
  }
  return LEGACY_MARKERS.some((key) => key in (input as Raw));
}

const asRaw = (value: unknown): Raw =>
  value !== null && typeof value === "object" ? (value as Raw) : {};

/**
 * Translates the original standalone identity.json layout (top-level issuer,
 * keys, encryptionKey, invite, defaultUser, smtp.auth) into the current one
 * (an `identity:` section, `encryption.key`, `smtp.user/password`), so
 * existing deployments keep starting with the same behavior: the original
 * defaults are kept where the current ones differ (refresh tokens 30d, invites
 * 2d, empty invite URLs and appUrl). Logs a deprecation warning when it does.
 */
function fromLegacyIdentityJson(input: unknown): unknown {
  if (!isLegacyIdentityJson(input)) {
    return input;
  }

  const raw = input as Raw;

  logger.warn(
    "identity config uses the original identity.json layout; it still works, but move to the identity: section (see the config migration guide)"
  );

  const {
    encryptionKey,
    defaultUser,
    invite,
    issuer,
    audience,
    keys,
    tokens,
    security,
    oauth2,
    smtp,
    ...rest
  } = raw;

  const legacySmtp = smtp as
    | (Raw & { auth?: { user?: string; pass?: string } })
    | undefined;
  const { auth, ...smtpRest } = legacySmtp ?? {};

  const legacyTokens = asRaw(tokens);
  const legacyInvite = asRaw(invite);

  return {
    ...rest,
    appUrl: rest.appUrl ?? "",
    ...(encryptionKey !== undefined
      ? { encryption: { key: encryptionKey } }
      : {}),
    ...(legacySmtp
      ? { smtp: { ...smtpRest, user: auth?.user, password: auth?.pass } }
      : {}),
    identity: {
      issuer,
      audience,
      keys,
      tokens: {
        ...legacyTokens,
        refreshTokenExpiresIn: legacyTokens.refreshTokenExpiresIn ?? "30d"
      },
      security,
      oauth2,
      invites: {
        url: legacyInvite.url ?? "",
        failUrl: legacyInvite.failUrl ?? "",
        expiration: legacyInvite.expiration ?? "2d"
      },
      owner: defaultUser
    }
  };
}

export { fromLegacyIdentityJson, isLegacyIdentityJson };
