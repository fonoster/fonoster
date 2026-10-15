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
import { AuditEntry, CatalogEntry, RegistryStore } from "./types";

export class MemoryRegistryStore implements RegistryStore {
  protected entries = new Map<string, CatalogEntry>();
  protected log: AuditEntry[] = [];

  all() {
    return [...this.entries.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  get(id: string) {
    return this.entries.get(id);
  }

  put(entry: CatalogEntry) {
    this.entries.set(entry.id, JSON.parse(JSON.stringify(entry)));
  }

  audit(entry: AuditEntry) {
    this.log.push(entry);
  }

  history(id?: string) {
    return id ? this.log.filter((e) => e.target === id) : [...this.log];
  }
}

/**
 * A JSON file store, for the operator utility until the registry tables exist (see build-log.md).
 * Every write rewrites the file atomically.
 */
export class FileRegistryStore extends MemoryRegistryStore {
  constructor(private readonly file: string) {
    super();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8")) as {
        entries: CatalogEntry[];
        audit: AuditEntry[];
      };
      for (const e of data.entries) this.entries.set(e.id, e);
      this.log = data.audit ?? [];
    }
  }

  put(entry: CatalogEntry) {
    super.put(entry);
    this.save();
  }

  audit(entry: AuditEntry) {
    super.audit(entry);
    this.save();
  }

  private save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(
      tmp,
      JSON.stringify({ entries: this.all(), audit: this.log }, null, 2)
    );
    fs.renameSync(tmp, this.file);
  }
}
