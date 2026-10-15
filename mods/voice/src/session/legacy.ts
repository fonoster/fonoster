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
import { RemovedMethodError } from "./errors";
import { Session } from "./Session";
import {
  GatherOptions,
  PlayOptions,
  SayOptions,
  TransferOptions
} from "./types";

/** What `(req, res)` handlers get as `req`: today's fields, filled from session.start. */
export type LegacyRequest = {
  appRef: string;
  callRef: string;
  mediaSessionRef: string;
  sessionRef: string;
  ingressNumber: string;
  callerNumber: string;
  callerName: string;
  callDirection: "FROM_PSTN" | "TO_PSTN";
  metadata: Record<string, unknown>;
  handoff: Record<string, unknown> | null;
};

/**
 * The `(req, res)` handler signature as a thin wrapper over the session (voice-sdk S1). Every
 * surviving method forwards to the session, so both signatures send the same messages.
 */
export function createLegacyResponse(session: Session) {
  const removed = (method: string, replacement: string) => () => {
    throw new RemovedMethodError(method, replacement);
  };
  return {
    answer: () => session.answer(),
    say: (text: string, options?: SayOptions) => session.say(text, options),
    stopSay: () => session.stopSay(),
    play: (url: string, options?: PlayOptions) => session.play(url, options),
    playDtmf: (digits: string) => session.playDtmf(digits),
    gather: (options?: GatherOptions) => session.gather(options),
    hangup: () => session.hangup(),
    transfer: (to: string, options?: TransferOptions) =>
      session.transfer(to, options),
    /** @deprecated use transfer() */
    dial: (to: string) => session.transfer(to),
    hold: (options?: { music?: string }) => session.hold(options),
    resume: () => session.resume(),
    handoff: (app: string, payload?: Record<string, unknown>) =>
      session.handoff(app, payload),
    session,
    // Removed in the session protocol; untyped callers get an error naming the replacement.
    record: removed(
      "record",
      "recording is now an app policy (call record settings)"
    ),
    setAudioFilters: removed(
      "setAudioFilters",
      "audio filters are now part of the app's configuration"
    ),
    mute: removed("mute", "use hold() so the caller hears nothing"),
    unmute: removed("unmute", "use resume() after hold()"),
    stream: removed("stream", "use session.audio (onFrame, send, mark, clear)"),
    sgather: removed(
      "sgather",
      "use session.on('turn.ended' | 'transcript.partial' | 'dtmf')"
    )
  } as const;
}

export type LegacyResponse = Omit<
  ReturnType<typeof createLegacyResponse>,
  "record" | "setAudioFilters" | "mute" | "unmute" | "stream" | "sgather"
>;

export function createLegacyRequest(session: Session): LegacyRequest {
  return {
    appRef: session.appRef,
    callRef: session.callRef,
    mediaSessionRef: session.sessionRef,
    sessionRef: session.sessionRef,
    ingressNumber: session.to,
    callerNumber: session.from,
    callerName: "",
    callDirection: session.direction === "outbound" ? "TO_PSTN" : "FROM_PSTN",
    metadata: session.metadata,
    handoff: session.handoffPayload
  };
}
