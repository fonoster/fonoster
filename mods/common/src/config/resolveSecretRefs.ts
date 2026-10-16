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
import { isAbsolute, join, resolve } from "path";

type Env = Record<string, string | undefined>;

/**
 * `secret://` references in config values (add-platform, decision D8). A string value that is
 * exactly a reference is replaced at startup by the secret it names, so YAML never holds the raw
 * secret:
 *
 *   secret://env/NAME                 the environment variable NAME
 *   secret://file/<absolute path>     a file's contents (e.g. secret://file/run/secrets/db-url)
 *   secret://k8s/<secret>#<key>       a Kubernetes Secret mounted as a volume, read from
 *   secret://k8s/<ns>/<secret>#<key>  <FONOSTER_SECRETS_DIR>/<secret>/<key>
 *                                     (default /var/run/fonoster/secrets; the Helm chart mounts
 *                                     every referenced Secret there). The namespace, when given,
 *                                     must be the pod's (POD_NAMESPACE) if that is known.
 *
 * File contents lose one trailing newline. Errors name the key path and the reference, never a
 * value. Values that only contain `secret://` somewhere else are left alone.
 */
export const SECRET_PREFIX = "secret://";
export const DEFAULT_SECRETS_DIR = "/var/run/fonoster/secrets";

export type SecretRefOptions = {
  env?: Env;
  /** Where Kubernetes Secrets are mounted (default FONOSTER_SECRETS_DIR or /var/run/fonoster/secrets). */
  secretsDir?: string;
  /** Reads a file (tests). */
  readFile?: (path: string) => string;
};

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const K8S_NAME = /^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/;
const K8S_KEY = /^[-._a-zA-Z0-9]+$/;

export function isSecretRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(SECRET_PREFIX);
}

function readSecretFile(ref: string, path: string, options: SecretRefOptions) {
  const read =
    options.readFile ?? ((p: string) => readFileSync(p, { encoding: "utf8" }));
  try {
    return read(path).replace(/\r?\n$/, "");
  } catch (e) {
    const code = (e as { code?: string }).code;
    throw new Error(`${ref}: cannot read ${path}${code ? ` (${code})` : ""}`);
  }
}

/** Resolves one `secret://` reference. Throws with a message that never contains the secret. */
export function resolveSecretRef(
  ref: string,
  options: SecretRefOptions = {}
): string {
  const env = options.env ?? process.env;
  const rest = ref.slice(SECRET_PREFIX.length);
  const slash = rest.indexOf("/");
  const kind = slash < 0 ? rest : rest.slice(0, slash);
  const target = slash < 0 ? "" : rest.slice(slash + 1);

  if (kind === "env") {
    if (!NAME.test(target)) throw new Error(`invalid variable name in ${ref}`);
    const value = env[target];
    if (value === undefined || value === "")
      throw new Error(`${ref}: environment variable ${target} is not set`);
    return value;
  }

  if (kind === "file") {
    if (!target) throw new Error(`${ref}: missing file path`);
    const path = resolve("/", target);
    return readSecretFile(ref, path, options);
  }

  if (kind === "k8s") {
    const hash = target.indexOf("#");
    if (hash < 0) throw new Error(`${ref}: missing #<key>`);
    const parts = target.slice(0, hash).split("/");
    const key = target.slice(hash + 1);
    if (parts.length > 2 || !parts.every((p) => K8S_NAME.test(p)))
      throw new Error(
        `${ref}: expected secret://k8s/[<namespace>/]<secret>#<key>`
      );
    if (!K8S_KEY.test(key)) throw new Error(`${ref}: invalid key`);
    const [namespace, name] =
      parts.length === 2 ? parts : [undefined, parts[0]];
    const podNamespace = env.POD_NAMESPACE;
    if (namespace && podNamespace && namespace !== podNamespace)
      throw new Error(
        `${ref}: Secrets of namespace ${namespace} are not mounted here (${podNamespace})`
      );
    const dir =
      options.secretsDir ?? env.FONOSTER_SECRETS_DIR ?? DEFAULT_SECRETS_DIR;
    const base = isAbsolute(dir) ? dir : resolve(dir);
    return readSecretFile(ref, join(base, name, key), options);
  }

  throw new Error(
    `unsupported reference ${ref} (use secret://env/NAME, secret://file/<path> or secret://k8s/<secret>#<key>)`
  );
}

function walk(
  input: unknown,
  options: SecretRefOptions,
  path: string
): unknown {
  if (isSecretRef(input)) {
    try {
      return resolveSecretRef(input, options);
    } catch (e) {
      throw new Error(`${path || "(root)"}: ${(e as Error).message}`);
    }
  }
  if (Array.isArray(input))
    return input.map((item, i) => walk(item, options, `${path}[${i}]`));
  if (input !== null && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [
        k,
        walk(v, options, path ? `${path}.${k}` : k)
      ])
    );
  }
  return input;
}

/**
 * Returns a copy of a parsed config with every `secret://` value resolved. Errors name the key
 * path (`providers.deepgram.credential.value: secret://env/DG: environment variable DG is not set`).
 */
export function resolveSecretRefs<T>(
  input: T,
  options: SecretRefOptions = {}
): T {
  return walk(input, options, "") as T;
}
