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
import { Sessions } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { NatsConnection } from "nats";
import { OwnerDirectory } from "./directory";

const logger = getLogger({ service: "billing", filePath: __filename });

/** How many calls an owner has in progress (for the concurrency limit, D7). */
export type ActiveCalls = { count(ownerRef: string): number };

/**
 * Active calls from the session registry: AppBridge keeps a `calls.<callRef>` lease, with the
 * workspace once the call is answered, rewriting it every few seconds until the call ends. A lease
 * not rewritten within the registry's TTL belongs to a dead AppBridge and stops counting.
 */
export class RegistryActiveCalls implements ActiveCalls {
  private calls = new Map<string, { owner: string; writtenAt: number }>();
  private stopWatch?: () => void;

  constructor(
    private readonly directory: OwnerDirectory,
    private readonly now = () => Date.now(),
    private readonly ttlMs = Sessions.SESSIONS_TTL_MS
  ) {}

  count(ownerRef: string) {
    let n = 0;
    const alive = this.now() - this.ttlMs;
    for (const [callRef, c] of this.calls) {
      if (c.writtenAt < alive) this.calls.delete(callRef);
      else if (c.owner === ownerRef) n++;
    }
    return n;
  }

  /** Adds, refreshes or removes one call from a registry entry. */
  async apply(entry: Sessions.SessionEntry) {
    const workspaceRef = entry.value?.workspaceRef as string | undefined;
    if (!workspaceRef) {
      this.calls.delete(entry.id);
      return;
    }
    const owner = await this.directory.ownerOf(workspaceRef);
    if (owner)
      this.calls.set(entry.id, { owner, writtenAt: entry.writtenAt.getTime() });
  }

  async watch(nc: NatsConnection, bucket?: string) {
    const kv = await Sessions.openSessions(nc, { bucket });
    this.stopWatch = await Sessions.watchSessions(kv, "calls", (entry) =>
      this.apply(entry).catch((e: Error) =>
        logger.warn(`active call ${entry.id} not counted: ${e.message}`)
      )
    );
    return this;
  }

  stop() {
    this.stopWatch?.();
  }
}
