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
import { getLogger } from "@fonoster/logger";
import { NatsConnection, StringCodec } from "nats";
import { WorkspaceDirectory } from "../regions/types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/** AppBridge asks here whether an inbound call's workspace was deleted (#1318). */
export const WORKSPACE_DELETED_SUBJECT = "workspaces.deleted";

/**
 * Answers `workspaces.deleted` from Identity's deletion records: `{deleted}`, or `{error}` when
 * the directory isn't attached or its database fails (AppBridge then admits the call). Uncached,
 * so a call right after a delete is refused. It only answers yes or no: nothing here erases.
 */
export function subscribeWorkspaceDeleted(
  nc: NatsConnection,
  directory: () => WorkspaceDirectory | undefined
) {
  const reply = (msg: { respond(data: Uint8Array): boolean }, body: object) =>
    msg.respond(sc.encode(JSON.stringify(body)));
  const sub = nc.subscribe(WORKSPACE_DELETED_SUBJECT, {
    queue: "apiserver",
    callback: (err, msg) => {
      if (err) return;
      let accessKeyId: unknown;
      try {
        accessKeyId = JSON.parse(sc.decode(msg.data))?.accessKeyId;
      } catch {
        // answered below as not deleted
      }
      if (typeof accessKeyId !== "string" || !accessKeyId)
        return void reply(msg, { deleted: false });
      const d = directory();
      if (!d) return void reply(msg, { error: "directory unavailable" });
      d.isDeleted(accessKeyId).then(
        (deleted) => reply(msg, { deleted }),
        (e) => {
          logger.warn(
            `workspaces.deleted: could not read deletion records: ${(e as Error).message}`
          );
          reply(msg, { error: "directory unavailable" });
        }
      );
    }
  });
  return () => sub.unsubscribe();
}
