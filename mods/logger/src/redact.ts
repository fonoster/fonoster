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
import winston from "winston";

const REDACTED = "[redacted]";

/** Field names whose values are never logged (compared lowercased, without `-` and `_`). */
const SECRET_NAMES = new Set([
  "password",
  "passwd",
  "currentpassword",
  "newpassword",
  "secret",
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "sessiontoken",
  "authtoken",
  "apikey",
  "apisecret",
  "accesskeysecret",
  "authorization",
  "clientsecret",
  "signingsecret",
  "privatekey",
  "encryptionkey",
  "verificationcode",
  "twofactorcode"
]);

const normalize = (key: string) => key.toLowerCase().replace(/[-_]/g, "");

/** True for field names that hold secrets: passwords, tokens, keys, secrets. */
function isSecretName(key: string): boolean {
  const name = normalize(key);
  return (
    SECRET_NAMES.has(name) ||
    name.endsWith("password") ||
    name.endsWith("secret") ||
    (name.endsWith("token") && name !== "tokenuse")
  );
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const isSet = (value: unknown) =>
  value !== undefined && value !== null && value !== "";

function redactField(key: string, value: unknown, seen: WeakSet<object>) {
  return isSecretName(key) && isSet(value)
    ? REDACTED
    : redactSecrets(value, seen);
}

/**
 * A copy of `value` with secret fields replaced by "[redacted]", at any depth
 * in plain objects and arrays. The value passed in is never changed.
 */
function redactSecrets(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    if (seen.has(value)) return value;
    seen.add(value);
    return value.map((item) => redactSecrets(item, seen));
  }
  if (!isPlainObject(value)) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      redactField(key, item, seen)
    ])
  );
}

/**
 * Winston format that redacts secret fields in a log entry's metadata, so a
 * request logged at verbose level never carries passwords or tokens.
 */
const redactFormat = winston.format((info) => {
  const seen = new WeakSet<object>();
  Object.keys(info)
    .filter((key) => key !== "level" && key !== "message")
    .forEach((key) => {
      info[key] = redactField(key, info[key], seen);
    });
  return info;
});

export { isSecretName, REDACTED, redactFormat, redactSecrets };
