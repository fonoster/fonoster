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
  CallRecordWriter,
  RECORD_PARTS,
  RecordPart
} from "@fonoster/callrecord";
import { getLogger } from "@fonoster/logger";
import { NatsConnection, StringCodec } from "nats";

const logger = getLogger({ service: "appbridge", filePath: __filename });
const sc = StringCodec();

/**
 * Retention and erasure run where the records and the region key live (the region), on request
 * from the control plane, which owns the policies, the index and the audit log. One queue group
 * per region, so one replica handles each request.
 */
export const maintenanceSubject = (region: string) =>
  `callrecord.${region}.maintenance`;

export type MaintenanceRequest = {
  op: "delete_parts" | "erase";
  callRef: string;
  workspaceRef?: string | null;
  /** Where the record is stored (RV-B10); the writer resolves the store by it. */
  location?: string;
  parts?: RecordPart[];
  reason: string;
  actor: string;
};

export async function handleMaintenance(
  writer: CallRecordWriter,
  req: MaintenanceRequest
) {
  // The workspace is required: the stored record must belong to it (RV-B6).
  if (
    !req.callRef ||
    !req.reason ||
    !req.actor ||
    typeof req.workspaceRef !== "string" ||
    !req.workspaceRef
  )
    return { type: "error", code: "bad_request" };
  try {
    if (req.op === "erase") {
      const r = await writer.erase(req.callRef, req);
      return { type: "ack", version: r.version, audit: r.audit };
    }
    if (req.op === "delete_parts") {
      const parts = (req.parts ?? []).filter((p) =>
        (RECORD_PARTS as readonly string[]).includes(p)
      );
      if (!parts.length) return { type: "error", code: "bad_request" };
      const r = await writer.deleteParts(req.callRef, parts, req);
      return { type: "ack", version: r.sealed.version, audit: r.audit };
    }
    return { type: "error", code: "bad_request" };
  } catch (e) {
    const message = (e as Error).message;
    return {
      type: "error",
      // A request for another workspace's record is refused (RV-B6).
      code: /no sealed record/.test(message)
        ? "not_found"
        : (e as Error).name === "WorkspaceMismatchError"
          ? "forbidden"
          : "error",
      message
    };
  }
}

export function serveRecordMaintenance(
  nc: NatsConnection,
  writer: CallRecordWriter
): () => void {
  const sub = nc.subscribe(maintenanceSubject(writer.region), {
    queue: `callrecord-maintenance-${writer.region}`,
    callback: (err, msg) => {
      if (err) return;
      let req: MaintenanceRequest;
      try {
        req = JSON.parse(sc.decode(msg.data));
      } catch {
        return msg.respond(
          sc.encode(JSON.stringify({ type: "error", code: "bad_request" }))
        );
      }
      void handleMaintenance(writer, req).then((reply) => {
        if (reply.type === "ack")
          logger.info(
            `call record ${req.callRef}: ${req.op} by ${req.actor} (${req.reason})`
          );
        msg.respond(sc.encode(JSON.stringify(reply)));
      });
    }
  });
  return () => sub.unsubscribe();
}
