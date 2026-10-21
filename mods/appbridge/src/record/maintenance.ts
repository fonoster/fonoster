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
  op: "delete_parts" | "erase" | "failed_call";
  callRef: string;
  workspaceRef?: string | null;
  /** Where the record is stored (RV-B10); the writer resolves the store by it. */
  location?: string;
  parts?: RecordPart[];
  reason: string;
  actor: string;
  /** failed_call: the record's event entries, in order. */
  entries?: Record<string, unknown>[];
};

/** Entries a failed_call record may hold (call.started, call.progress, call.failed). */
const FAILED_CALL_TYPES = ["call.started", "call.progress", "call.failed"];

/**
 * The minimal record of an outbound call that never reached an app (busy, no answer, rejected):
 * no AppBridge ever saw the call, so the control plane, which learns it from the node's
 * `call.ended`, asks the region to write and seal it (redesign-roomr; voice-session "Busy
 * callee"). Only the three event types above are accepted; the record is sealed at once.
 */
function writeFailedCall(writer: CallRecordWriter, req: MaintenanceRequest) {
  const entries = Array.isArray(req.entries) ? req.entries : [];
  if (
    !req.callRef ||
    !entries.length ||
    entries.length > FAILED_CALL_TYPES.length ||
    !entries.every(
      (m) =>
        m &&
        typeof m === "object" &&
        FAILED_CALL_TYPES.includes(String((m as { type?: unknown }).type))
    )
  )
    return { type: "error", code: "bad_request" };
  const at = Date.now();
  for (const message of entries)
    writer.append(req.callRef, { at, source: "event", message });
  writer.close(req.callRef);
  return { type: "ack" };
}

export async function handleMaintenance(
  writer: CallRecordWriter,
  req: MaintenanceRequest
) {
  if (req.op === "failed_call") return writeFailedCall(writer, req);
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
        if (reply.type === "ack" && req.op !== "failed_call")
          logger.info(
            `call record ${req.callRef}: ${req.op} by ${req.actor} (${req.reason})`
          );
        msg.respond(sc.encode(JSON.stringify(reply)));
      });
    }
  });
  return () => sub.unsubscribe();
}
