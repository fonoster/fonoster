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
import { EventEmitter } from "events";
import { Roomr } from "@fonoster/common";

// One call's control stream as AppBridge sees it (redesign-roomr media-control "Each call opens
// one control stream to the session endpoint"): the node's Start, then its Dtmf and Event
// messages in; Answer, Ready, Reject and the app's commands out. AppBridge keeps its side open
// until the node's Ended or the stream's end, so the node can report what happens after a
// transfer. Audio never travels here: it is RTP between the two MediaEndpoints.

/** Where a message went or came from, for the optional tap (tests, debugging). */
export type StreamTap = (
  callRef: string,
  direction: "in" | "out",
  type: string,
  message: Record<string, unknown>
) => void;

/**
 * Emits "dtmf" (SessionDtmf), "event" (SessionEvent, one member set) and "close" once, with
 * `ended` (the node's Ended, or undefined when the stream closed without one: a lost node).
 */
export class ControlStream extends EventEmitter {
  private closed = false;
  private ended?: { cause: string; sipStatus?: number };
  /** What arrived before the call listened (`listen()`), in order. */
  private held?: [string, unknown[]][] = [];
  callRef = "";

  constructor(
    private readonly stream: Roomr.SessionServerStream,
    private readonly tap?: StreamTap
  ) {
    super();
    stream.on("data", (m: Roomr.NodeMessage) => this.onMessage(m));
    stream.on("end", () => this.onGone());
    stream.on("error", () => this.onGone());
    // The node's connection broke, or its keepalive pings went unanswered (5.6).
    stream.on("cancelled", () => this.onGone());
    stream.on("close", () => this.onGone());
  }

  /** The first message, which must be Start; undefined when the stream ends or sends another. */
  static first(
    stream: Roomr.SessionServerStream,
    timeoutMs: number
  ): Promise<Roomr.SessionStart | undefined> {
    return new Promise((resolve) => {
      const done = (start?: Roomr.SessionStart) => {
        clearTimeout(timer);
        stream.off("data", onData);
        stream.off("end", onEnd);
        stream.off("error", onEnd);
        stream.off("cancelled", onEnd);
        resolve(start);
      };
      const onData = (m: Roomr.NodeMessage) =>
        done(m.start && (m.msg ?? "start") === "start" ? m.start : undefined);
      const onEnd = () => done(undefined);
      const timer = setTimeout(onEnd, timeoutMs);
      stream.on("data", onData);
      stream.on("end", onEnd);
      stream.on("error", onEnd);
      stream.on("cancelled", onEnd);
    });
  }

  /** Starts delivering events, first those that arrived while the call was being set up. */
  listen() {
    const held = this.held ?? [];
    this.held = undefined;
    for (const [name, args] of held) super.emit(name, ...args);
    if (this.closed) this.removeAllListeners();
  }

  /** Delivers now, or holds until `listen()`. */
  private deliver(name: string, ...args: unknown[]) {
    if (this.held) this.held.push([name, args]);
    else super.emit(name, ...args);
  }

  get isOpen() {
    return !this.closed;
  }

  /** The node's Ended, once it came. */
  get endedBy() {
    return this.ended;
  }

  /** Writes one message; false when the stream is gone. */
  send(message: Roomr.AppMessage): boolean {
    if (this.closed) return false;
    const type = Roomr.messageType(message, Roomr.APP_MESSAGE_TYPES) ?? "?";
    this.tap?.(this.callRef, "out", type, message as Record<string, unknown>);
    try {
      this.stream.write(message);
      return true;
    } catch {
      return false;
    }
  }

  answer(media: Roomr.MediaEndpoint, maxDurationS?: number) {
    return this.send({
      answer: { media, ...(maxDurationS ? { maxDurationS } : {}) }
    });
  }

  ready(media: Roomr.MediaEndpoint) {
    return this.send({ ready: { media } });
  }

  reject(sipStatus: number, reason?: string) {
    return this.send({ reject: { sipStatus, ...(reason ? { reason } : {}) } });
  }

  hangup(sipStatus?: number) {
    return this.send({ hangup: sipStatus ? { sipStatus } : {} });
  }

  /** Closes AppBridge's side (after Ended, or to give up the call). */
  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.stream.end();
    } catch {
      // already gone
    }
    this.deliver("close", this.ended);
    if (!this.held) this.removeAllListeners();
  }

  private onMessage(m: Roomr.NodeMessage) {
    if (this.closed) return;
    const type = Roomr.messageType(m, Roomr.NODE_MESSAGE_TYPES);
    if (type === "dtmf" && m.dtmf) {
      this.tap?.(this.callRef, "in", "dtmf", m.dtmf);
      this.deliver("dtmf", m.dtmf);
    } else if (type === "event" && m.event) {
      const kind = Roomr.messageType(m.event, Roomr.SESSION_EVENT_TYPES);
      if (!kind) return;
      const body = ((m.event as Record<string, unknown>)[kind] ?? {}) as Record<
        string,
        unknown
      >;
      this.tap?.(this.callRef, "in", kind, body);
      if (kind === "ended") this.ended = m.event.ended;
      this.deliver("event", kind, body);
      // Ended is the node's last word: close our side.
      if (kind === "ended") this.close();
    }
    // A second Start, or a message this AppBridge does not know, is ignored (messages only grow).
  }

  private onGone() {
    if (this.closed) return;
    this.close();
  }
}
