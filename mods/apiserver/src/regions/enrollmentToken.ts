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
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  KeyObject
} from "crypto";
import jwt from "jsonwebtoken";
import { REGION_AUDIENCE } from "./types";

/** The claims of an enrollment token (contract §1). */
export type EnrollmentClaims = {
  iss: string;
  aud: string;
  sub: string;
  wsp: string;
  cp: string;
  leaf: string;
  jti: string;
  iat: number;
  exp: number;
};

export class EnrollmentTokenError extends Error {
  constructor(readonly code: "token_invalid" | "token_expired") {
    super(code);
  }
}

export const ENROLLMENT_TOKEN_TTL_SECONDS = 24 * 60 * 60;

/** RFC 7638 thumbprint of an EC public JWK, the default `kid`. */
function thumbprint(key: KeyObject) {
  const jwk = key.export({ format: "jwk" }) as Record<string, string>;
  const canonical = JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y
  });
  return createHash("sha256").update(canonical).digest("base64url");
}

/**
 * The control plane's region-signing key (ES256, P-256): signs enrollment tokens, verifies them on
 * enrollment and publishes its public key as a JWK Set at /.well-known/region-keys.json.
 */
export function createRegionSigner(options: {
  privateKeyPem: string;
  kid?: string;
}) {
  const privateKey = createPrivateKey(options.privateKeyPem);
  const publicKey = createPublicKey(privateKey);
  const jwk = publicKey.export({ format: "jwk" }) as Record<string, string>;
  if (jwk.crv !== "P-256")
    throw new Error("the region-signing key must be an EC P-256 key (ES256)");
  const kid = options.kid ?? thumbprint(publicKey);

  return {
    kid,
    sign(
      claims: Omit<EnrollmentClaims, "aud" | "iat" | "exp">,
      ttl = ENROLLMENT_TOKEN_TTL_SECONDS
    ) {
      return jwt.sign({ ...claims, aud: REGION_AUDIENCE }, privateKey, {
        algorithm: "ES256",
        keyid: kid,
        expiresIn: ttl
      });
    },
    /** The verified claims; throws EnrollmentTokenError. */
    verify(token: string): EnrollmentClaims {
      try {
        const claims = jwt.verify(token, publicKey, {
          algorithms: ["ES256"],
          audience: REGION_AUDIENCE
        }) as EnrollmentClaims;
        if (!claims.sub || !claims.jti || !claims.wsp)
          throw new EnrollmentTokenError("token_invalid");
        return claims;
      } catch (e) {
        if (e instanceof EnrollmentTokenError) throw e;
        if ((e as Error).name === "TokenExpiredError")
          throw new EnrollmentTokenError("token_expired");
        throw new EnrollmentTokenError("token_invalid");
      }
    },
    jwks() {
      return {
        keys: [{ ...jwk, kid, alg: "ES256", use: "sig" }]
      };
    }
  };
}

export type RegionSigner = ReturnType<typeof createRegionSigner>;
