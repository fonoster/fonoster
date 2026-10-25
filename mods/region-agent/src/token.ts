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
import { createPublicKey, JsonWebKey, verify } from "crypto";
import { URL } from "url";
import { CONTRACT_VERSION, EnrollmentClaims } from "./types";

// The enrollment token (contract 1): an ES256 JWT whose keys are served at
// `{cp}/.well-known/region-keys.json`. Checked here before anything is sent, so a pasted token that
// is cut, expired or for another audience fails with a clear message (RC-B2).

export type EnrollErrorCode =
  | "token_invalid"
  | "token_expired"
  | "token_used"
  | "region_not_found"
  | "region_deleted"
  | "workspace_deleted"
  | "control_plane_mismatch"
  | "insecure_url"
  | "unreachable"
  | "enroll_failed";

const HINTS: Record<EnrollErrorCode, string> = {
  token_invalid:
    "the token is not valid (bad signature, wrong audience or cut when copied). Copy it again from the region's page in your account (operators: fonoster-region token <id>).",
  token_expired:
    "the token expired (tokens last 24 hours). Re-issue a token from the region's page in your account (operators: fonoster-region token <id>) and enroll again.",
  token_used:
    "the token was already used. Each token enrolls one region machine once; re-issue a token from the region's page in your account (operators: fonoster-region token <id>) (this revokes the machine enrolled before).",
  region_not_found:
    "the control plane does not know this region. It may have been deleted; create the region again.",
  region_deleted: "the region was deleted, so it cannot enroll.",
  workspace_deleted:
    "the region's workspace was deleted, so the region cannot enroll.",
  control_plane_mismatch:
    "the token is for a different control plane than --control-plane.",
  insecure_url:
    "the token points to a plain-text URL; --allow-insecure is only for a private network (a region inside the control plane's own network). Over HTTPS with an install's generated certificate, use --ca-file instead.",
  unreachable: "the control plane could not be reached.",
  enroll_failed: "the control plane refused the enrollment."
};

export class EnrollError extends Error {
  constructor(
    readonly code: EnrollErrorCode,
    detail?: string
  ) {
    super(`${code}: ${HINTS[code]}${detail ? ` (${detail})` : ""}`);
  }
}

const b64url = (s: string) => Buffer.from(s, "base64url");

/** The token's header and claims, unverified. */
export function decodeToken(token: string): {
  header: { alg?: string; kid?: string; typ?: string };
  claims: EnrollmentClaims;
  signingInput: string;
  signature: Buffer;
} {
  const parts = token.trim().split(".");
  if (parts.length !== 3)
    throw new EnrollError("token_invalid", "not a JWT (three dot parts)");
  try {
    return {
      header: JSON.parse(b64url(parts[0]).toString("utf8")),
      claims: JSON.parse(b64url(parts[1]).toString("utf8")),
      signingInput: `${parts[0]}.${parts[1]}`,
      signature: b64url(parts[2])
    };
  } catch {
    throw new EnrollError("token_invalid", "undecodable header or claims");
  }
}

export type JwkSet = { keys: (JsonWebKey & { kid?: string })[] };

/** Checks signature (ES256), audience, expiry and the claims enrollment needs. */
export function verifyToken(
  token: string,
  keys: JwkSet,
  now: number = Date.now()
): EnrollmentClaims {
  const { header, claims, signingInput, signature } = decodeToken(token);
  if (header.alg !== "ES256")
    throw new EnrollError("token_invalid", `alg ${header.alg}, want ES256`);
  const candidates = (keys.keys ?? []).filter(
    (k) => k.kty === "EC" && (!header.kid || !k.kid || k.kid === header.kid)
  );
  if (!candidates.length)
    throw new EnrollError("token_invalid", `no key with kid ${header.kid}`);
  const ok = candidates.some((jwk) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { kid, ...material } = jwk;
      return verify(
        "sha256",
        Buffer.from(signingInput),
        {
          key: createPublicKey({ key: material, format: "jwk" }),
          dsaEncoding: "ieee-p1363"
        },
        signature
      );
    } catch {
      return false;
    }
  });
  if (!ok) throw new EnrollError("token_invalid", "bad signature");
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(CONTRACT_VERSION))
    throw new EnrollError("token_invalid", `audience ${claims.aud}`);
  for (const c of ["sub", "cp", "leaf", "jti"] as const)
    if (!claims[c]) throw new EnrollError("token_invalid", `no ${c} claim`);
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= now)
    throw new EnrollError("token_expired");
  return claims;
}

const LOCAL = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Plain-text control-plane and leaf URLs only with --allow-insecure (or on this host). */
export function checkUrls(
  claims: EnrollmentClaims,
  options: { allowInsecure?: boolean; controlPlane?: string }
) {
  if (options.controlPlane) {
    const want = new URL(options.controlPlane).origin;
    if (new URL(claims.cp).origin !== want)
      throw new EnrollError(
        "control_plane_mismatch",
        `${claims.cp} is not ${want}`
      );
  }
  if (options.allowInsecure) return;
  const cp = new URL(claims.cp);
  if (cp.protocol !== "https:" && !LOCAL.has(cp.hostname))
    throw new EnrollError("insecure_url", claims.cp);
  const leaf = new URL(claims.leaf);
  if (leaf.protocol !== "tls:" && !LOCAL.has(leaf.hostname))
    throw new EnrollError("insecure_url", claims.leaf);
}
