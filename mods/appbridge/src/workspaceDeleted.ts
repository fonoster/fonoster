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
import { NatsConnection, StringCodec } from "nats";

const sc = StringCodec();

/** The apiserver answers here whether a workspace was deleted (#1318). */
export const WORKSPACE_DELETED_SUBJECT = "workspaces.deleted";

/** How long an inbound call waits for the answer before it is admitted anyway. */
export const WORKSPACE_CHECK_TIMEOUT_MS = 300;

/** How long a "deleted" answer is kept (deletion records are permanent; a restore is rare). */
export const DELETED_ANSWER_TTL_MS = 60_000;

export type WorkspaceCheckResult =
  { deleted: boolean } | { deleted: false; failed: string };

/**
 * Asks the apiserver whether a workspace was deleted, before an inbound call is admitted. A
 * "deleted" answer is kept for 60 s, a "live" one never, so a call right after a delete is
 * refused. It fails open: no answer, an error or a malformed reply is `failed`, not deleted.
 */
export class WorkspaceDeletionCheck {
  private readonly deletedUntil = new Map<string, number>();

  constructor(
    private readonly nc: NatsConnection,
    private readonly now: () => number = Date.now
  ) {}

  async check(accessKeyId: string): Promise<WorkspaceCheckResult> {
    const until = this.deletedUntil.get(accessKeyId);
    if (until !== undefined && this.now() < until) return { deleted: true };
    this.deletedUntil.delete(accessKeyId);
    let reply: { deleted?: unknown; error?: unknown };
    try {
      const msg = await this.nc.request(
        WORKSPACE_DELETED_SUBJECT,
        sc.encode(JSON.stringify({ accessKeyId })),
        { timeout: WORKSPACE_CHECK_TIMEOUT_MS }
      );
      reply = JSON.parse(sc.decode(msg.data)) ?? {};
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "TIMEOUT")
        return {
          deleted: false,
          failed: `no answer in ${WORKSPACE_CHECK_TIMEOUT_MS} ms`
        };
      if (code === "503") return { deleted: false, failed: "no responders" };
      if (e instanceof SyntaxError)
        return { deleted: false, failed: "malformed reply" };
      return { deleted: false, failed: (e as Error).message };
    }
    if (typeof reply.error === "string")
      return { deleted: false, failed: reply.error };
    if (typeof reply.deleted !== "boolean")
      return { deleted: false, failed: "malformed reply" };
    if (reply.deleted)
      this.deletedUntil.set(accessKeyId, this.now() + DELETED_ANSWER_TTL_MS);
    return { deleted: reply.deleted };
  }
}
