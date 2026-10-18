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
import { SessionStart } from "@fonoster/common";
import { convert, Format, INTERNAL } from "../audio/pcm";
import { Incoming, ProtocolCodec } from "./types";

const MULAW_8K: Format = { codec: "pcmu", rate: 8000 };

/**
 * twilio-media-streams-flavor: the Twilio Media Streams bidirectional protocol, μ-law 8 kHz in
 * base64. Audio, marks, clears and caller DTMF only; everything else is dropped both ways.
 */
export class TwilioCodec implements ProtocolCodec {
  readonly speechLayer = false;
  private streamSid = "";
  private callSid = "";
  private sequence = 0;
  private chunk = 0;
  private startedAt = 0;

  constructor(
    private readonly send: (data: string) => void,
    private readonly accountSid: string
  ) {}

  private emit(message: Record<string, unknown>) {
    this.send(
      JSON.stringify({ ...message, sequenceNumber: String(++this.sequence) })
    );
  }

  start(start: SessionStart) {
    this.streamSid = start.sessionRef;
    this.callSid = start.callRef;
    this.startedAt = Date.now();
    this.send(
      JSON.stringify({ event: "connected", protocol: "Call", version: "1.0.0" })
    );
    this.emit({
      event: "start",
      streamSid: this.streamSid,
      start: {
        streamSid: this.streamSid,
        accountSid: this.accountSid,
        callSid: start.callRef,
        tracks: ["inbound"],
        customParameters: start.metadata ?? {},
        mediaFormat: {
          encoding: "audio/x-mulaw",
          sampleRate: 8000,
          channels: 1
        }
      }
    });
  }

  event(message: Record<string, unknown>) {
    if (message.type === "mark") {
      this.emit({
        event: "mark",
        streamSid: this.streamSid,
        mark: { name: message.name }
      });
    } else if (message.type === "dtmf") {
      this.emit({
        event: "dtmf",
        streamSid: this.streamSid,
        dtmf: { track: "inbound_track", digit: message.digit }
      });
    }
  }

  callerAudio(frame: Buffer) {
    this.emit({
      event: "media",
      streamSid: this.streamSid,
      media: {
        track: "inbound",
        chunk: String(++this.chunk),
        timestamp: String(Date.now() - this.startedAt),
        payload: convert(frame, INTERNAL, MULAW_8K).toString("base64")
      }
    });
  }

  end(_message: Record<string, unknown>) {
    this.emit({
      event: "stop",
      streamSid: this.streamSid,
      stop: { accountSid: this.accountSid, callSid: this.callSid }
    });
  }

  parse(raw: Buffer, isBinary: boolean): Incoming {
    if (isBinary) return { kind: "ignore" };
    let data: {
      event?: string;
      media?: { payload?: string };
      mark?: { name?: string };
    };
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return { kind: "ignore" };
    }
    switch (data.event) {
      case "media":
        if (typeof data.media?.payload !== "string") return { kind: "ignore" };
        return {
          kind: "audio",
          audio: convert(
            Buffer.from(data.media.payload, "base64"),
            MULAW_8K,
            INTERNAL
          )
        };
      case "mark":
        if (!data.mark?.name) return { kind: "ignore" };
        return {
          kind: "command",
          command: { type: "mark", name: data.mark.name }
        };
      case "clear":
        return { kind: "command", command: { type: "clear" } };
      default:
        // Anything outside Media Streams (transfer, TwiML...) is ignored (Twilio protocol scope).
        return { kind: "ignore" };
    }
  }
}
