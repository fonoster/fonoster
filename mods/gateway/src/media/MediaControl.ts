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
import { NatsConnection, StringCodec, Subscription } from "nats";

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
  /** Sends a command and resolves with the ack; rejects with MediaCommandError otherwise. */
  command(nodeId: string, command: MediaCommand): Promise<MediaReply>;
  /** Receives every event of one room until the returned function is called. */
  subscribeRoom(
    nodeId: string,
    roomRef: string,
    handler: (event: MediaEvent) => void
  ): () => void;
  /** Receives `call.incoming` from every node, shared across gateway replicas. */
  onIncoming(handler: (nodeId: string, event: MediaEvent) => void): () => void;
}

const sc = StringCodec();

export class NatsMediaControl implements MediaControl {
  constructor(
    private readonly nc: NatsConnection,
    private readonly options: { queue?: string; timeoutMs?: number } = {}
  ) {}

  async command(nodeId: string, command: MediaCommand): Promise<MediaReply> {
    let reply: MediaReply;
    try {
      const msg = await this.nc.request(
        `media.${nodeId}.commands`,
        sc.encode(JSON.stringify(command)),
        {
          timeout: this.options.timeoutMs ?? REPLY_TIMEOUT_MS
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

  onIncoming(handler: (nodeId: string, event: MediaEvent) => void): () => void {
    // One queue group: each incoming call is served by exactly one gateway replica. Other event
    // types reaching this subscription are ignored; room owners subscribe to their room directly.
    const sub: Subscription = this.nc.subscribe("media.*.events.*", {
      queue: this.options.queue ?? "gateway-incoming",
      callback: (err, msg) => {
        if (err) return;
        const event = JSON.parse(sc.decode(msg.data)) as MediaEvent;
        if (event.type === "call.incoming")
          handler(msg.subject.split(".")[1], event);
      }
    });
    return () => sub.unsubscribe();
  }
}
