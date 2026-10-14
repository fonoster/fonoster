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
import { randomBytes, scrypt, ScryptOptions, timingSafeEqual } from "crypto";

const SCRYPT_PARAMS = { N: 2 ** 15, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function deriveKey(
  password: string,
  salt: Buffer,
  params: { N: number; r: number; p: number }
): Promise<Buffer> {
  const options: ScryptOptions = {
    ...params,
    // scrypt needs 128 * N * r bytes; leave headroom over Node's 32 MiB default.
    maxmem: 256 * params.N * params.r
  };

  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key)
    )
  );
}

/**
 * One-way digest for storing a password: `scrypt$N$r$p$salt$hash`
 * (base64 salt and hash). The parameters travel with the digest so they can
 * be raised later without invalidating existing ones.
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const { N, r, p } = SCRYPT_PARAMS;
  const key = await deriveKey(password, salt, SCRYPT_PARAMS);

  return [
    "scrypt",
    N,
    r,
    p,
    salt.toString("base64"),
    key.toString("base64")
  ].join("$");
}

/** Checks a password against a digest from `hashPassword`, in constant time. */
async function verifyPasswordDigest(
  password: string,
  digest: string
): Promise<boolean> {
  const [scheme, N, r, p, salt, hash] = digest.split("$");

  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "base64");
  const actual = await deriveKey(password, Buffer.from(salt, "base64"), {
    N: Number(N),
    r: Number(r),
    p: Number(p)
  });

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Constant-time comparison for legacy (decrypted) passwords. */
function equalsInConstantTime(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export { equalsInConstantTime, hashPassword, verifyPasswordDigest };
