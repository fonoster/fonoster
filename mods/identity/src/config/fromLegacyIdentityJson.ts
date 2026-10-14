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

/**
 * Translates the original standalone identity.json layout (top-level issuer,
 * keys, encryptionKey, invite, defaultUser, smtp.auth) into the current one
 * (an `identity:` section, `encryption.key`, `smtp.user/password`), so
 * existing deployments keep starting. Logs a deprecation warning when it does.
 */
function fromLegacyIdentityJson(input: unknown): unknown {
  if (input === null || typeof input !== "object" || "identity" in input) {
    return input;
  }

  const raw = input as Raw;
  if (!LEGACY_MARKERS.some((key) => key in raw)) {
    return input;
  }

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

  return {
    ...rest,
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
      tokens,
      security,
      oauth2,
      invites: invite,
      owner: defaultUser
    }
  };
}

export { fromLegacyIdentityJson };
