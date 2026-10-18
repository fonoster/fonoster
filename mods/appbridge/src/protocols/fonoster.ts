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
import { convert, Format, INTERNAL, parseCodec } from "../audio/pcm";
import { Incoming, ProtocolCodec } from "./types";

export const CALLER_TRACK_ID = 1;
export const AGENT_TRACK_ID = 2;

/** A binary audio frame for an app socket: the track id byte, then the audio. */
export function withTrackId(track: number, audio: Buffer): Buffer {
  const out = Buffer.allocUnsafe(1 + audio.length);
  out[0] = track;
  audio.copy(out, 1);
  return out;
}

/** The fonoster protocol: JSON text frames for messages, binary frames for audio. */
export class FonosterCodec implements ProtocolCodec {
  readonly speechLayer = true;
  private readonly format: Format;

  constructor(
    private readonly send: (data: string | Buffer) => void,
    audio: { codec: string; rate: number }
  ) {
    this.format = parseCodec(audio.codec, audio.rate);
  }

  start(start: SessionStart) {
    this.send(JSON.stringify(start));
  }

  event(message: Record<string, unknown>) {
    this.send(JSON.stringify(message));
  }

  callerAudio(frame: Buffer) {
    // Frames from the gateway start with their track id (voice-session, Listen-only sockets).
    this.send(
      withTrackId(CALLER_TRACK_ID, convert(frame, INTERNAL, this.format))
    );
  }

  end(message: Record<string, unknown>) {
    this.send(JSON.stringify(message));
  }

  parse(raw: Buffer, isBinary: boolean): Incoming {
    if (isBinary)
      return { kind: "audio", audio: convert(raw, this.format, INTERNAL) };
    let data: unknown;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return { kind: "bad", reason: "frame is not JSON" };
    }
    if (
      typeof data !== "object" ||
      data === null ||
      Array.isArray(data) ||
      typeof (data as { type?: unknown }).type !== "string"
    ) {
      return { kind: "bad", reason: "message has no type" };
    }
    return { kind: "command", command: data as Record<string, unknown> };
  }
}
