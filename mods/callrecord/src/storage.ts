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
import { Part, RecordEntry, SealedVersion, SignedVcon } from "./types";

/**
 * Where working records and sealed records live: region object storage, or the workspace's own
 * bucket. This interface is what the writer needs; `FsRecordStorage` is the local implementation.
 */
export interface RecordStorage {
  /** Appends one entry durably (each append survives a crash on its own). */
  append(callRef: string, entry: RecordEntry): void;
  readWorking(callRef: string): RecordEntry[];
  /** Working records not sealed yet, with the time of their last append. */
  listWorking(): { callRef: string; lastAppendAt: number }[];
  discardWorking(callRef: string): void;
  putSealed(callRef: string, sealed: SealedVersion): void;
  /** The current version, or a given one. */
  getSealed(callRef: string, version?: number): SealedVersion | undefined;
  /** Removes a stored part (retention, erasure); returns whether it existed. */
  deletePart(callRef: string, version: number, name: string): boolean;
}

export class FsRecordStorage implements RecordStorage {
  constructor(private readonly dir: string) {
    fs.mkdirSync(path.join(dir, "working"), { recursive: true });
    fs.mkdirSync(path.join(dir, "sealed"), { recursive: true });
  }

  private workingFile(callRef: string) {
    return path.join(this.dir, "working", `${safe(callRef)}.jsonl`);
  }

  private versionDir(callRef: string, version: number) {
    return path.join(this.dir, "sealed", safe(callRef), `v${version}`);
  }

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
  }

  putSealed(callRef: string, sealed: SealedVersion) {
    const dir = this.versionDir(callRef, sealed.version);
    if (fs.existsSync(dir))
      throw new Error(`${callRef} v${sealed.version} is already sealed`);
    fs.mkdirSync(path.join(dir, "parts"), { recursive: true });
    for (const part of sealed.parts)
      fs.writeFileSync(path.join(dir, "parts", part.name), part.data);
    fs.writeFileSync(
      path.join(dir, "vcon.jws.json"),
      JSON.stringify(sealed.signed)
    );
    fs.writeFileSync(
      path.join(dir, "vcon.redacted.jws.json"),
      JSON.stringify(sealed.redacted)
    );
    fs.writeFileSync(
      path.join(dir, "parts.json"),
      JSON.stringify(
        sealed.parts.map((p) => ({ name: p.name, mimetype: p.mimetype }))
      )
    );
    fs.writeFileSync(
      path.join(this.dir, "sealed", safe(callRef), "current"),
      String(sealed.version)
    );
  }

  getSealed(callRef: string, version?: number): SealedVersion | undefined {
    const base = path.join(this.dir, "sealed", safe(callRef));
    if (!fs.existsSync(path.join(base, "current"))) return undefined;
    const v =
      version ?? Number(fs.readFileSync(path.join(base, "current"), "utf8"));
    const dir = this.versionDir(callRef, v);
    if (!fs.existsSync(dir)) return undefined;
    const read = (f: string) =>
      JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const parts = (
      read("parts.json") as { name: string; mimetype: string }[]
    ).flatMap((p) => {
      const file = path.join(dir, "parts", p.name);
      return fs.existsSync(file) ? [{ ...p, data: fs.readFileSync(file) }] : [];
    });
    return {
      version: v,
      signed: read("vcon.jws.json") as SignedVcon,
      redacted: read("vcon.redacted.jws.json") as SignedVcon,
      parts
    };
  }

  deletePart(callRef: string, version: number, name: string): boolean {
    const file = path.join(this.versionDir(callRef, version), "parts", name);
    if (!fs.existsSync(file)) return false;
    fs.rmSync(file);
    return true;
  }
}

function safe(callRef: string) {
  return callRef.replace(/[^A-Za-z0-9._-]/g, "_");
}

export type { Part };
