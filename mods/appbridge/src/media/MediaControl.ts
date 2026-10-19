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
import { TRACEPARENT_HEADER } from "@fonoster/common";
import {
  headers,
  MsgHdrs,
  NatsConnection,
  StringCodec,
  Subscription
} from "nats";

// media-control, "media-control runs over NATS request and reply".

export type MediaCommand = { type: string; id: string; [key: string]: unknown };
export type MediaReply = {
  type: "ack" | "error";
  id: string;
  code?: string;
  message?: string;
  [key: string]: unknown;
};
export type MediaEvent = {
  type: string;
  id?: string;
  roomRef?: string;
  [key: string]: unknown;
};

export const REPLY_TIMEOUT_MS = 2000;

export class MediaCommandError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export interface MediaControl {
  /**
   * Sends a command and resolves with the ack; rejects with MediaCommandError otherwise.
   * `traceparent` (W3C) travels as a NATS header so the node's span joins the call's trace.
   */
  command(
    nodeId: string,
    command: MediaCommand,
    traceparent?: string
  ): Promise<MediaReply>;
  /** Receives every event of one room until the returned function is called. */
  subscribeRoom(
    nodeId: string,
    roomRef: string,
    handler: (event: MediaEvent) => void
  ): () => void;
  /**
   * Claims `call.incoming` requests (media-control, "Incoming calls are claimed by exactly one
   * AppBridge replica"). Replicas share one queue group, so each call reaches one of them.
   */
  onIncoming(
    handler: (nodeId: string, event: MediaEvent, traceparent?: string) => void
  ): () => void;
  /** Receives every node's `node.heartbeat` and `node.down` (every replica, no queue group). */
  onNodeStatus(handler: (event: MediaEvent) => void): () => void;
}

/** Subject Roomr nodes send `call.incoming` requests to. */
export const INCOMING_SUBJECT = "appbridge.incoming";
/** A node's heartbeat and node.down subject (media-control "Nodes report capacity and liveness"). */
export const heartbeatSubject = (nodeRef: string) =>
  `roomr.nodes.${nodeRef}.heartbeat`;

const sc = StringCodec();

/** NATS headers carrying a W3C traceparent (trace propagation between services). */
export function traceHeaders(traceparent: string): MsgHdrs {
  const h = headers();
  h.set(TRACEPARENT_HEADER, traceparent);
  return h;
}

/** The traceparent of a received message, if any (exact or canonical key). */
export function readTraceparent(h?: MsgHdrs): string | undefined {
  return h?.get(TRACEPARENT_HEADER) || h?.get("Traceparent") || undefined;
}

export class NatsMediaControl implements MediaControl {
  constructor(
    private readonly nc: NatsConnection,
    private readonly options: {
      queue?: string;
      timeoutMs?: number;
      bridgeRef?: string;
    } = {}
  ) {}

  async command(
    nodeId: string,
    command: MediaCommand,
    traceparent?: string
  ): Promise<MediaReply> {
    let reply: MediaReply;
    try {
      // AppBridge names itself on every command: the node ends the room if this AppBridge
      // goes away (roomr "Rooms without an owner end"), also for calls placed over Roomr,
      // whose CreateCall names no AppBridge.
      const body = this.options.bridgeRef
        ? { ...command, bridgeRef: this.options.bridgeRef }
        : command;
      const msg = await this.nc.request(
        `media.${nodeId}.commands`,
        sc.encode(JSON.stringify(body)),
        {
          timeout: this.options.timeoutMs ?? REPLY_TIMEOUT_MS,
          ...(traceparent ? { headers: traceHeaders(traceparent) } : {})
        }
      );
      reply = JSON.parse(sc.decode(msg.data));
    } catch (e) {
      throw new MediaCommandError(
        "timeout",
        `${command.type} got no reply from ${nodeId}: ${(e as Error).message}`
      );
    }
    if (reply.type !== "ack") {
      throw new MediaCommandError(
        reply.code ?? "error",
        `${command.type} failed: ${reply.code ?? "error"}`
      );
    }
    return reply;
  }

  subscribeRoom(
    nodeId: string,
    roomRef: string,
    handler: (event: MediaEvent) => void
  ): () => void {
    const sub = this.nc.subscribe(`media.${nodeId}.events.${roomRef}`, {
      callback: (err, msg) => {
        if (!err) handler(JSON.parse(sc.decode(msg.data)));
      }
    });
    return () => sub.unsubscribe();
  }

  onIncoming(
    handler: (nodeId: string, event: MediaEvent, traceparent?: string) => void
  ): () => void {
    const bridgeRef = this.options.bridgeRef ?? "appbridge";
    const sub: Subscription = this.nc.subscribe(INCOMING_SUBJECT, {
      queue: this.options.queue ?? "appbridge-incoming",
      callback: (err, msg) => {
        if (err) return;
        let event: MediaEvent;
        try {
          event = JSON.parse(sc.decode(msg.data)) as MediaEvent;
        } catch {
          return;
        }
        if (event.type !== "call.incoming") return;
        // Claim first: the node gives up after 500 ms. Routing happens after the claim.
        msg.respond(
          sc.encode(
            JSON.stringify({ type: "claimed", id: event.id, bridgeRef })
          )
        );
        handler(
          String(event.nodeId ?? ""),
          event,
          readTraceparent(msg.headers)
        );
      }
    });
    return () => sub.unsubscribe();
  }

  onNodeStatus(handler: (event: MediaEvent) => void): () => void {
    const sub = this.nc.subscribe(heartbeatSubject("*"), {
      callback: (err, msg) => {
        if (err) return;
        try {
          handler(JSON.parse(sc.decode(msg.data)) as MediaEvent);
        } catch {
          // not ours
        }
      }
    });
    return () => sub.unsubscribe();
  }
}
