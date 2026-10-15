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
import { createPublicKey, generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { es256, KeyCustodyLike, KeyHistory, SigningKey } from "./sign";

// Region signing-key custody (add-call-record task 2.6, build log LO-B5). The writer never holds
// a key itself: it asks a custody for the current key id and a signature. `FileKeyCustody` keeps
// keys in a directory and supports rotation; a KMS or Vault custody implements the same interface
// (sign remotely, list public keys) without the private key ever reaching the gateway.

export interface KeyCustody extends KeyCustodyLike {
  /** The key that signs new records, and the published key set URL. */
  current(): { kid: string; jku?: string };
  /** Signs with the named key (ES256, raw r||s). */
  sign(kid: string, input: Buffer): Promise<Buffer>;
  /** Every key ever used (kid → SPKI PEM), current included: the published key set. */
  publicKeys(): KeyHistory;
}

const spki = (pem: string) =>
  createPublicKey(pem).export({ type: "spki", format: "pem" }).toString();

/** One fixed key (the `privateKeyFile` config), plus earlier public keys to keep publishing. */
export class StaticKeyCustody implements KeyCustody {
  constructor(
    private readonly key: SigningKey,
    private readonly earlier: KeyHistory = {}
  ) {}

  current() {
    return { kid: this.key.kid, jku: this.key.jku };
  }

  async sign(kid: string, input: Buffer) {
    if (kid !== this.key.kid) throw new Error(`no private key for ${kid}`);
    return es256(this.key.privateKeyPem, input);
  }

  publicKeys(): KeyHistory {
    return { ...this.earlier, [this.key.kid]: spki(this.key.privateKeyPem) };
  }
}

export function isKeyCustody(x: unknown): x is KeyCustody {
  return (
    typeof (x as KeyCustody)?.sign === "function" &&
    typeof (x as KeyCustody)?.current === "function"
  );
}

const KID = /^[A-Za-z0-9._-]{1,64}$/;
const CURRENT = "current";

/**
 * Keys in a directory: `<kid>.key.pem` (mode 0600), `<kid>.pub.pem` and `current` (the kid that
 * signs). `rotate` adds a key and points `current` at it atomically; running writers pick it up on
 * their next signature. Earlier public keys stay, so they stay in the published set; `retire`
 * deletes an old private key and keeps its public half.
 */
export class FileKeyCustody implements KeyCustody {
  private kid?: string;
  private stamp = -1;
  private readonly privates = new Map<string, string>();

  constructor(
    readonly dir: string,
    private readonly options: { jku?: string } = {}
  ) {}

  /** Re-reads `current` when it changed (one stat per signature). */
  current() {
    const file = path.join(this.dir, CURRENT);
    let st: fs.Stats;
    try {
      st = fs.statSync(file);
    } catch {
      throw new Error(
        `no signing key in ${this.dir}: run fonoster-callrecord keys rotate --dir ${this.dir}`
      );
    }
    if (st.mtimeMs !== this.stamp || !this.kid) {
      const kid = fs.readFileSync(file, "utf8").trim();
      if (!KID.test(kid)) throw new Error(`bad key id in ${file}`);
      this.kid = kid;
      this.stamp = st.mtimeMs;
    }
    return { kid: this.kid, jku: this.options.jku };
  }

  async sign(kid: string, input: Buffer) {
    let pem = this.privates.get(kid);
    if (!pem) {
      if (!KID.test(kid)) throw new Error(`bad key id ${kid}`);
      pem = fs.readFileSync(path.join(this.dir, `${kid}.key.pem`), "utf8");
      this.privates.set(kid, pem);
    }
    return es256(pem, input);
  }

  publicKeys(): KeyHistory {
    const out: KeyHistory = {};
    for (const f of fs.readdirSync(this.dir).sort()) {
      const m = /^(.+)\.pub\.pem$/.exec(f);
      if (m && KID.test(m[1]))
        out[m[1]] = spki(fs.readFileSync(path.join(this.dir, f), "utf8"));
    }
    return out;
  }

  /** The kids in the directory, oldest first by file time, with whether each can still sign. */
  list(): { kid: string; current: boolean; canSign: boolean }[] {
    let current: string | undefined;
    try {
      current = this.current().kid;
    } catch {
      current = undefined;
    }
    return Object.keys(this.publicKeys())
      .map((kid) => ({
        kid,
        at: fs.statSync(path.join(this.dir, `${kid}.pub.pem`)).mtimeMs,
        current: kid === current,
        canSign: fs.existsSync(path.join(this.dir, `${kid}.key.pem`))
      }))
      .sort((a, b) => a.at - b.at || a.kid.localeCompare(b.kid))
      .map(({ kid, current, canSign }) => ({ kid, current, canSign }));
  }

  /** Creates a new P-256 key and makes it current; returns its kid. */
  static rotate(
    dir: string,
    options: { kid?: string; prefix?: string; now?: Date } = {}
  ): string {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const stamp = (options.now ?? new Date())
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\..*$/, "");
    const kid = options.kid ?? `${options.prefix ?? "region"}-${stamp}`;
    if (!KID.test(kid)) throw new Error(`bad key id ${kid}`);
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256"
    });
    // `wx`: never overwrite a key that may have signed records.
    fs.writeFileSync(
      path.join(dir, `${kid}.key.pem`),
      privateKey.export({ type: "pkcs8", format: "pem" }),
      { mode: 0o600, flag: "wx" }
    );
    fs.writeFileSync(
      path.join(dir, `${kid}.pub.pem`),
      publicKey.export({ type: "spki", format: "pem" }),
      { flag: "wx" }
    );
    const tmp = path.join(dir, `.${CURRENT}.${process.pid}`);
    fs.writeFileSync(tmp, `${kid}\n`);
    fs.renameSync(tmp, path.join(dir, CURRENT));
    return kid;
  }

  /** Deletes an earlier key's private half; its public half stays published. */
  static retire(dir: string, kid: string) {
    if (!KID.test(kid)) throw new Error(`bad key id ${kid}`);
    const current = fs.readFileSync(path.join(dir, CURRENT), "utf8").trim();
    if (current === kid)
      throw new Error(`${kid} is the current key; rotate first`);
    fs.rmSync(path.join(dir, `${kid}.key.pem`), { force: true });
  }
}
