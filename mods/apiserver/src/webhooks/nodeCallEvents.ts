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
import { Webhooks } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { NatsConnection, StringCodec } from "nats";
import { LostCalls } from "./lostCalls";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/** One replica handles each node event (core NATS queue group). */
export const NODE_EVENTS_QUEUE = "apiserver-roomr-events";

/** The minimal record of an unanswered outbound call, written where the region keeps records. */
export type FailedCallRecord = {
  callRef: string;
  workspaceRef: string | null;
  /** The node's region (its heartbeat), where the record is written. */
  region?: string;
  entries: Record<string, unknown>[];
};

export type FailedCallRecords = (record: FailedCallRecord) => Promise<unknown>;

/** Where records go when the node reports no region (AppBridge's `callRecord.region` default). */
export const DEFAULT_RECORD_REGION = "default";

/**
 * Writes failed-call records through the region's record maintenance subject
 * (`callrecord.<region>.maintenance`, op `failed_call`, served by the AppBridge replicas that hold
 * the region's signing key): the control plane never holds it.
 */
export function natsFailedCallRecords(
  nc: NatsConnection,
  timeoutMs = 5_000
): FailedCallRecords {
  return async (record) => {
    const region = record.region || DEFAULT_RECORD_REGION;
    const msg = await nc.request(
      `callrecord.${region}.maintenance`,
      sc.encode(
        JSON.stringify({
          op: "failed_call",
          callRef: record.callRef,
          workspaceRef: record.workspaceRef,
          entries: record.entries,
          reason: "unanswered outbound call",
          actor: "control-plane"
        })
      ),
      { timeout: timeoutMs }
    );
    const reply = JSON.parse(sc.decode(msg.data));
    if (reply?.type !== "ack")
      throw new Error(`record not written: ${reply?.code ?? "error"}`);
    return reply;
  };
}

/** The minimal record's entries (as AppBridge wrote them for calls that never reached an app). */
export function failedCallEntries(
  call: Webhooks.UnansweredCall,
  workspaceRef: string | null
): Record<string, unknown>[] {
  const sip = call.sipStatus ? { sipStatus: call.sipStatus } : {};
  return [
    {
      type: "call.started",
      direction: "outbound",
      appRef: call.appRef,
      workspaceRef,
      from: call.from,
      to: call.to
    },
    { type: "call.progress", status: call.reason, ...sip },
    { type: "call.failed", reason: call.reason, ...sip }
  ];
}

/**
 * The control plane's reading of the Roomr nodes' call events (`roomr.events.<call_ref>`, one
 * replica per event): what no AppBridge can report.
 *
 * - An outbound call the control plane placed (its `metadata.app_ref`) that ends unanswered
 *   (`call.ended` with `answered: false`: busy, no answer, rejected, node error, removed) reached
 *   no AppBridge: its minimal call record (call.started, call.progress, call.failed) is written
 *   (`records`) and `call.failed` goes to the fan-out (`intake`).
 * - A call the node ended with cause `app_gone` lost its AppBridge: `lost` sends its `call.ended`
 *   (`appbridge-lost`) unless AppBridge ended the call itself.
 *
 * Events are best effort (media-control "Events are best effort while NATS is down"): one lost in
 * an outage is never replayed; TrackCall's and the placement sweep's own sweeps close what it
 * would have closed.
 */
export function createNodeCallEvents(deps: {
  lost?: LostCalls;
  intake: (event: Webhooks.WebhookEvent) => Promise<unknown> | unknown;
  records?: FailedCallRecords;
  /** The workspace of an app (the record names it; the webhook resolves it itself). */
  workspaceOfApp?: (appRef: string) => Promise<string | undefined>;
  /** The region of a node from its heartbeats. */
  regionOf?: (nodeRef: string) => string | undefined;
}) {
  return {
    async onEvent(subject: string, event: Record<string, unknown>) {
      if (event?.type !== "call.ended") return;
      if (event.cause === "app_gone" && typeof event.call_ref === "string") {
        await deps.lost?.onAppGone(event.call_ref);
      }
      const call = Webhooks.unansweredOutboundCall(subject, event);
      if (!call) return;
      const workspaceRef =
        (await deps.workspaceOfApp?.(call.appRef).catch(() => undefined)) ??
        null;
      await Promise.all([
        deps
          .records?.({
            callRef: call.callRef,
            workspaceRef,
            region: deps.regionOf?.(call.nodeRef),
            entries: failedCallEntries(call, workspaceRef)
          })
          .catch((e) =>
            logger.warn(
              `call ${call.callRef}: minimal record not written: ${(e as Error).message}`
            )
          ),
        deps.intake(Webhooks.unansweredCallFailed(call))
      ]);
    }
  };
}

/**
 * Subscribes to the nodes' call events (one replica per event) and their heartbeats (each node's
 * region); returns a stop function.
 */
export function subscribeNodeCallEvents(
  nc: NatsConnection,
  deps: Omit<Parameters<typeof createNodeCallEvents>[0], "regionOf">
): () => void {
  const regions = new Map<string, string>();
  const handler = createNodeCallEvents({
    ...deps,
    regionOf: (nodeRef) => regions.get(nodeRef)
  });
  const parse = (data: Uint8Array) => {
    try {
      const v = JSON.parse(sc.decode(data));
      return v && typeof v === "object"
        ? (v as Record<string, unknown>)
        : undefined;
    } catch {
      return undefined;
    }
  };
  const events = nc.subscribe(Webhooks.ROOMR_CALL_EVENTS_SUBJECT, {
    queue: NODE_EVENTS_QUEUE,
    callback: (err, msg) => {
      if (err) return;
      const event = parse(msg.data);
      if (!event) return;
      handler
        .onEvent(msg.subject, event)
        .catch((e) =>
          logger.warn(`node call event failed: ${(e as Error).message}`)
        );
    }
  });
  const beats = nc.subscribe("roomr.nodes.*.heartbeat", {
    callback: (err, msg) => {
      if (err) return;
      const beat = parse(msg.data);
      if (
        beat?.type === "node.heartbeat" &&
        typeof beat.node_ref === "string" &&
        typeof beat.region === "string" &&
        beat.region
      ) {
        // Bounded: nodes come and go (a new node_ref per start).
        if (regions.size >= 1024 && !regions.has(beat.node_ref))
          regions.clear();
        regions.set(beat.node_ref, beat.region);
      }
    }
  });
  return () => {
    events.unsubscribe();
    beats.unsubscribe();
  };
}
