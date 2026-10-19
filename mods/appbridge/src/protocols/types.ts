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

export type Incoming =
  | { kind: "command"; command: Record<string, unknown> }
  | { kind: "audio"; audio: Buffer }
  | { kind: "bad"; reason: string }
  | { kind: "ignore" };

/**
 * Translates between the session and one wire protocol. The session speaks fonoster messages
 * internally; a codec decides what each protocol's app sees and how its frames are read.
 */
export interface ProtocolCodec {
  /** Whether the protocol offers the Speech layer (turn events, speak, play). */
  readonly speechLayer: boolean;
  /** Opening messages, built from the fonoster session.start. */
  start(start: SessionStart): void;
  /** A fonoster appbridge → app message; protocols drop what they do not carry. */
  event(message: Record<string, unknown>): void;
  /** One 20 ms internal frame of caller audio. */
  callerAudio(frame: Buffer): void;
  /** Closing message (fonoster session.end, Twilio stop). */
  end(message: Record<string, unknown>): void;
  /** Reads one frame from the app. */
  parse(raw: Buffer, isBinary: boolean): Incoming;
}
