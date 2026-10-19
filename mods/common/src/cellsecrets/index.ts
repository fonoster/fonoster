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
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync
} from "crypto";
import * as fs from "fs";
import * as path from "path";

// The secret store of a private region's cell (add-private-regions PR-4): provider keys and other
// secrets that never leave the cell. Two backends:
//   - an encrypted file (Compose, bare metal): AES-256-GCM, key derived with scrypt from a
//     passphrase in the environment (default FONOSTER_REGION_SECRETS_KEY);
//   - a directory with one file per secret: a mounted Kubernetes Secret.
// AppBridge and the hosted Autopilot read it; `fonoster-region secrets` writes it. Values are
// never logged; `names()` is what the region agent reports in heartbeats.

/** Secret names: provider ids and credential refs (`deepgram`, `groq`, `openai`, `s3.secret`). */
export const SECRET_NAME = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export type CellSecretsConfig = {
  /** The encrypted file. */
  file?: string;
  /** A directory with one file per secret (a mounted Kubernetes Secret). */
  dir?: string;
  /** Environment variable with the file's passphrase (default FONOSTER_REGION_SECRETS_KEY). */
  keyEnv?: string;
  /** The passphrase itself (tests); prefer keyEnv. */
  key?: string;
};

export const DEFAULT_SECRETS_KEY_ENV = "FONOSTER_REGION_SECRETS_KEY";

export interface CellSecretStore {
  get(name: string): string | undefined;
  /** The names that are set, sorted. */
  names(): string[];
  set(name: string, value: string): void;
  /** Returns whether the secret existed. */
  delete(name: string): boolean;
}

export function assertSecretName(name: string) {
  if (!SECRET_NAME.test(name))
    throw new Error(
      `invalid secret name "${name}" (lowercase letters, digits, ".", "_" and "-"; up to 64)`
    );
}

/** Writes a file atomically with mode 0600. */
export function writePrivateFile(file: string, data: string | Buffer) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(tmp, data, { mode: 0o600 });
  fs.renameSync(tmp, file);
}

type Sealed = { v: 1; salt: string; iv: string; tag: string; data: string };

/** One AES-256-GCM sealed JSON object `{name: value}` in a file. */
export class EncryptedFileSecretStore implements CellSecretStore {
  private cache?: { mtimeMs: number; values: Record<string, string> };
  private keys = new Map<string, Buffer>();

  constructor(
    private readonly file: string,
    private readonly passphrase: string
  ) {
    if (!passphrase)
      throw new Error("the region secret store needs a key (passphrase)");
  }

  private key(salt: Buffer) {
    const id = salt.toString("base64");
    let k = this.keys.get(id);
    if (!k) {
      k = scryptSync(this.passphrase, salt, 32);
      this.keys.set(id, k);
    }
    return k;
  }

  private read(): Record<string, string> {
    if (!fs.existsSync(this.file)) return {};
    const mtimeMs = fs.statSync(this.file).mtimeMs;
    if (this.cache && this.cache.mtimeMs === mtimeMs) return this.cache.values;
    const sealed = JSON.parse(fs.readFileSync(this.file, "utf8")) as Sealed;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key(Buffer.from(sealed.salt, "base64")),
      Buffer.from(sealed.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
    let plain: Buffer;
    try {
      plain = Buffer.concat([
        decipher.update(Buffer.from(sealed.data, "base64")),
        decipher.final()
      ]);
    } catch {
      throw new Error(
        `cannot decrypt ${this.file}: wrong key (check ${DEFAULT_SECRETS_KEY_ENV})`
      );
    }
    const values = JSON.parse(plain.toString("utf8")) as Record<string, string>;
    this.cache = { mtimeMs, values };
    return values;
  }

  private write(values: Record<string, string>) {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key(salt), iv);
    const data = Buffer.concat([
      cipher.update(Buffer.from(JSON.stringify(values), "utf8")),
      cipher.final()
    ]);
    const sealed: Sealed = {
      v: 1,
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: data.toString("base64")
    };
    writePrivateFile(this.file, JSON.stringify(sealed));
    this.cache = undefined;
  }

  get(name: string) {
    return this.read()[name] || undefined;
  }

  names() {
    return Object.keys(this.read()).sort();
  }

  set(name: string, value: string) {
    assertSecretName(name);
    if (!value) throw new Error("empty secret value");
    this.write({ ...this.read(), [name]: value });
  }

  delete(name: string) {
    const values = { ...this.read() };
    if (!(name in values)) return false;
    delete values[name];
    this.write(values);
    return true;
  }
}

/**
 * One file per secret: a mounted Kubernetes Secret (keys are file names; `..data` and other
 * dot-entries are Kubernetes' own). Trailing newlines are trimmed.
 */
export class DirectorySecretStore implements CellSecretStore {
  constructor(private readonly dir: string) {}

  get(name: string) {
    if (!SECRET_NAME.test(name)) return undefined;
    const file = path.join(this.dir, name);
    if (!fs.existsSync(file)) return undefined;
    return fs.readFileSync(file, "utf8").replace(/\r?\n$/, "") || undefined;
  }

  names() {
    if (!fs.existsSync(this.dir)) return [];
    return fs
      .readdirSync(this.dir)
      .filter((n) => SECRET_NAME.test(n))
      .filter((n) => fs.statSync(path.join(this.dir, n)).isFile())
      .sort();
  }

  set(name: string, value: string) {
    assertSecretName(name);
    if (!value) throw new Error("empty secret value");
    writePrivateFile(path.join(this.dir, name), value);
  }

  delete(name: string) {
    if (!SECRET_NAME.test(name)) return false;
    const file = path.join(this.dir, name);
    if (!fs.existsSync(file)) return false;
    fs.rmSync(file);
    return true;
  }
}

/** The store a config names (dir wins over file). */
export function openCellSecrets(
  config: CellSecretsConfig,
  env: Record<string, string | undefined> = process.env
): CellSecretStore {
  if (config.dir) return new DirectorySecretStore(config.dir);
  if (!config.file) throw new Error("cellSecrets: set file or dir");
  const key = config.key ?? env[config.keyEnv ?? DEFAULT_SECRETS_KEY_ENV];
  if (!key)
    throw new Error(
      `cellSecrets: ${config.keyEnv ?? DEFAULT_SECRETS_KEY_ENV} is not set`
    );
  return new EncryptedFileSecretStore(config.file, key);
}

/**
 * The cell's secrets as a workspace key source (appbridge Catalog, Autopilot): a private region
 * serves one workspace, so the provider name alone picks the key. Read errors count as unset.
 */
export class CellSecretKeys {
  constructor(private readonly store: CellSecretStore) {}

  async get(_workspaceRef: string, providerId: string) {
    try {
      return this.store.get(providerId);
    } catch {
      return undefined;
    }
  }

  /** By credentialRef first, then by the providers that use that ref. */
  forCredentialRef(
    credentialRef: string,
    providers: { id: string; credentialRef: string }[] = []
  ): string | undefined {
    try {
      const direct = SECRET_NAME.test(credentialRef)
        ? this.store.get(credentialRef)
        : undefined;
      if (direct) return direct;
      for (const p of providers.filter(
        (x) => x.credentialRef === credentialRef
      ))
        if (SECRET_NAME.test(p.id)) {
          const v = this.store.get(p.id);
          if (v) return v;
        }
    } catch {
      return undefined;
    }
    return undefined;
  }
}

/** What `NatsWorkspaceKeys` needs of a NATS connection (nats.js connections fit). */
export interface KeyRequester {
  request(
    subject: string,
    data: Uint8Array,
    options: { timeout: number }
  ): Promise<{ data: Uint8Array }>;
}

/** The cell-local subject the region agent answers (contract 6); it never crosses the link. */
export const CELL_WORKSPACE_KEYS_SUBJECT = "cell.workspacekeys.get";

/**
 * A workspace's bring-your-own key in a public region (add-private-regions PR-20): asked of the
 * region agent on the cell's NATS for each call, which asks the control plane over the region
 * link. Never cached and never logged; undefined (the region's own key applies) when the
 * workspace has none or the answer does not come within the timeout.
 */
export class NatsWorkspaceKeys {
  /** Never cached: AppBridge keeps no adapter built with these keys past the call's lookup. */
  readonly cacheable = false;

  constructor(
    private readonly requester: () => Promise<KeyRequester>,
    private readonly timeoutMs = 2000
  ) {}

  async get(
    workspaceRef: string,
    providerId: string
  ): Promise<string | undefined> {
    if (!workspaceRef || !providerId) return undefined;
    try {
      const nc = await this.requester();
      const reply = await nc.request(
        CELL_WORKSPACE_KEYS_SUBJECT,
        Buffer.from(JSON.stringify({ workspaceRef, provider: providerId })),
        { timeout: this.timeoutMs }
      );
      const body = JSON.parse(Buffer.from(reply.data).toString("utf8")) as {
        value?: unknown;
      };
      return typeof body.value === "string" && body.value
        ? body.value
        : undefined;
    } catch {
      return undefined;
    }
  }
}
