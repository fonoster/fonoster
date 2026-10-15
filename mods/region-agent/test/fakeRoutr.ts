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
import { randomUUID } from "crypto";
import { RoutrKind, RoutrPort } from "../src/apply/RoutrApplier";

/** An in-memory Routr: makes its own refs like the real one, and refuses dangling references. */
export class FakeRoutr implements RoutrPort {
  readonly items = new Map<
    string,
    { kind: RoutrKind; data: Record<string, unknown> }
  >();

  of(kind: RoutrKind) {
    return [...this.items.entries()]
      .filter(([, v]) => v.kind === kind)
      .map(([ref, v]) => ({ ref, ...v.data }));
  }

  async create(kind: RoutrKind, data: Record<string, unknown>) {
    for (const f of [
      "domainRef",
      "trunkRef",
      "credentialsRef",
      "accessControlListRef"
    ])
      if (data[f] && !this.items.has(String(data[f])))
        throw new Error(`${f} ${data[f]} does not exist`);
    if (
      kind === "peers" &&
      this.of("peers").some((p) => p.username === data.username)
    )
      throw new Error("peer already exists");
    const ref = randomUUID();
    this.items.set(ref, { kind, data: { ...data } });
    return { ref, ...data };
  }

  async update(
    kind: RoutrKind,
    data: Record<string, unknown> & { ref: string }
  ) {
    const item = this.items.get(data.ref);
    if (!item || item.kind !== kind) throw new Error("resource not found");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ref, ...rest } = data;
    item.data = { ...item.data, ...rest };
  }

  async delete(kind: RoutrKind, ref: string) {
    const item = this.items.get(ref);
    if (!item || item.kind !== kind) throw new Error("resource not found");
    this.items.delete(ref);
  }
}
