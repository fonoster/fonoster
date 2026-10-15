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
import * as fs from "fs";
import * as path from "path";
import { FsObjectStore, ObjectStore } from "./objectStore";
import { contentHash } from "./sign";
import { Part, RecordEntry, SealedVersion, SignedVcon } from "./types";

/**
 * Working records live on the gateway's local disk while the call runs: one fsynced JSON line
 * per entry, plus the raw recording tracks. Sealed records go to object storage (RecordStore).
 */
export class FsWorkingStore {
  constructor(private readonly dir: string) {
    fs.mkdirSync(path.join(dir, "working"), { recursive: true });
  }

  private workingFile(callRef: string) {
    return path.join(this.dir, "working", `${safe(callRef)}.jsonl`);
  }

  /** Where the recorder writes this call's raw tracks. */
  recordingDir(callRef: string) {
    return path.join(this.dir, "working", `${safe(callRef)}.rec`);
  }

  /** Appends one entry durably (each append survives a crash on its own). */
  append(callRef: string, entry: RecordEntry) {
    const fd = fs.openSync(this.workingFile(callRef), "a");
    try {
      fs.writeSync(fd, JSON.stringify(entry) + "\n");
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  }

  readWorking(callRef: string): RecordEntry[] {
    const file = this.workingFile(callRef);
    if (!fs.existsSync(file)) return [];
    return fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as RecordEntry];
        } catch {
          return []; // a torn last line after a crash
        }
      });
  }

  /** Working records not sealed yet, with the time of their last append. */
  listWorking() {
    const dir = path.join(this.dir, "working");
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => ({
        callRef: f.slice(0, -6),
        lastAppendAt: fs.statSync(path.join(dir, f)).mtimeMs
      }));
  }

  discardWorking(callRef: string) {
    fs.rmSync(this.workingFile(callRef), { force: true });
    fs.rmSync(this.recordingDir(callRef), { recursive: true, force: true });
  }
}

export type ManifestPart = {
  name: string;
  mimetype: string;
  content_hash: string;
  size: number;
};

export type Manifest = {
  version: number;
  sealedAt: string;
  parts: ManifestPart[];
};

/** A stored version without its part contents (for reads that do not need the audio). */
export type StoredVersion = {
  version: number;
  signed?: SignedVcon;
  redacted?: SignedVcon;
  manifest: Manifest;
};

/**
 * Sealed records in object storage. Layout per call:
 *   <callRef>/current                     the current version number
 *   <callRef>/v<n>/vcon.jws.json          the signed original
 *   <callRef>/v<n>/vcon.redacted.jws.json the signed redacted copy
 *   <callRef>/v<n>/manifest.json          parts of that version, with hashes and sizes
 *   <callRef>/parts/<name>                the parts (recording, messages), shared by versions
 * A version is never rewritten; retention and erasure delete objects and add a version.
 */
export class RecordStore {
  constructor(readonly objects: ObjectStore) {}

  get location() {
    return this.objects.location;
  }

  private key(callRef: string, ...rest: string[]) {
    return [safe(callRef), ...rest].join("/");
  }

  async currentVersion(callRef: string): Promise<number | undefined> {
    const v = await this.objects.get(this.key(callRef, "current"));
    return v ? Number(v.toString()) : undefined;
  }

  async putSealed(callRef: string, sealed: SealedVersion) {
    const v = `v${sealed.version}`;
    if (await this.objects.get(this.key(callRef, v, "manifest.json")))
      throw new Error(`${callRef} ${v} is already sealed`);
    for (const part of sealed.parts) {
      const key = this.key(callRef, "parts", part.name);
      if (!(await this.objects.get(key)))
        await this.objects.put(key, part.data, part.mimetype);
    }
    const json = (o: unknown) => Buffer.from(JSON.stringify(o));
    await this.objects.put(
      this.key(callRef, v, "vcon.jws.json"),
      json(sealed.signed),
      "application/json"
    );
    await this.objects.put(
      this.key(callRef, v, "vcon.redacted.jws.json"),
      json(sealed.redacted),
      "application/json"
    );
    const manifest: Manifest = {
      version: sealed.version,
      sealedAt: new Date().toISOString(),
      parts: sealed.parts.map((p) => ({
        name: p.name,
        mimetype: p.mimetype,
        content_hash: contentHash(p.data),
        size: p.data.length
      }))
    };
    await this.objects.put(
      this.key(callRef, v, "manifest.json"),
      json(manifest),
      "application/json"
    );
    await this.objects.put(
      this.key(callRef, "current"),
      Buffer.from(String(sealed.version)),
      "text/plain"
    );
  }

  /** A version's vCons and manifest, without loading part contents. */
  async getVersion(
    callRef: string,
    version?: number
  ): Promise<StoredVersion | undefined> {
    const v = version ?? (await this.currentVersion(callRef));
    if (v === undefined) return undefined;
    const read = async (name: string) => {
      const data = await this.objects.get(this.key(callRef, `v${v}`, name));
      return data ? JSON.parse(data.toString()) : undefined;
    };
    const manifest = (await read("manifest.json")) as Manifest | undefined;
    if (!manifest) return undefined;
    return {
      version: v,
      manifest,
      signed: await read("vcon.jws.json"),
      redacted: await read("vcon.redacted.jws.json")
    };
  }

  /** The current version, or a given one, with every part still stored. */
  async getSealed(
    callRef: string,
    version?: number
  ): Promise<SealedVersion | undefined> {
    const stored = await this.getVersion(callRef, version);
    if (!stored?.signed || !stored.redacted) return undefined;
    const parts: Part[] = [];
    for (const p of stored.manifest.parts) {
      const data = await this.getPart(callRef, p.name);
      if (data) parts.push({ name: p.name, mimetype: p.mimetype, data });
    }
    return {
      version: stored.version,
      signed: stored.signed,
      redacted: stored.redacted,
      parts
    };
  }

  getPart(callRef: string, name: string) {
    return this.objects.get(this.key(callRef, "parts", name));
  }

  /** Removes a stored part (retention, erasure); returns whether it existed. */
  deletePart(callRef: string, name: string) {
    return this.objects.delete(this.key(callRef, "parts", name));
  }

  /** Removes a version's vCons (their contents were deleted); the manifest stays as a trace. */
  async deleteVersionContents(callRef: string, version: number) {
    await this.objects.delete(
      this.key(callRef, `v${version}`, "vcon.jws.json")
    );
    await this.objects.delete(
      this.key(callRef, `v${version}`, "vcon.redacted.jws.json")
    );
  }

  /** Removes every object of a call (erasure). */
  async deleteAll(callRef: string) {
    for (const key of await this.objects.list(`${safe(callRef)}/`))
      await this.objects.delete(key);
  }

  /** Every call with a sealed record (for rebuilding derived stores). */
  async listCalls(): Promise<string[]> {
    return (await this.objects.list(""))
      .filter((k) => k.endsWith("/current"))
      .map((k) => k.slice(0, -"/current".length));
  }
}

/** A working store and a record store in one directory (development and tests). */
export function fsStores(dir: string) {
  return {
    working: new FsWorkingStore(dir),
    store: new RecordStore(new FsObjectStore(path.join(dir, "sealed")))
  };
}

export function safe(callRef: string) {
  return callRef.replace(/[^A-Za-z0-9._-]/g, "_");
}

export type { Part };
