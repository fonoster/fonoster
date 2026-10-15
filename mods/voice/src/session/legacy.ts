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
import { getLogger } from "@fonoster/logger";
import { RemovedMethodError } from "./errors";
import { Session } from "./Session";
import {
  GatherOptions,
  PlayOptions,
  SayOptions,
  TransferOptions
} from "./types";

const logger = getLogger({ service: "voice", filePath: __filename });

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

/** Today's stream payload shape (mods/common/src/voice/Stream.ts), kept for old apps. */
export type LegacyStreamPayload = {
  mediaSessionRef: string;
  streamRef: string;
  format: "WAV";
  type: "AUDIO_IN" | "AUDIO_OUT";
  data?: Uint8Array;
};

/** Today's stream gather payload shape (mods/common/src/voice/StreamGather.ts). */
export type LegacyStreamGatherPayload = {
  mediaSessionRef: string;
  speech?: string;
  digit?: string;
  responseTime: number;
};

const warned = new Set<string>();
function deprecated(method: string, replacement: string) {
  if (warned.has(method)) return;
  warned.add(method);
  logger.warn(`res.${method}() is deprecated; use ${replacement}`);
}

/**
 * res.stream(), rebuilt on session.audio (owner decision: keep it working, deprecated). Caller audio
 * arrives as AUDIO_IN payloads (raw frames in the session's format); write() sends agent audio.
 */
function legacyStream(session: Session) {
  deprecated("stream", "session.audio (onFrame, send, mark, clear)");
  const streamRef = `stream-${session.sessionRef}`;
  const callbacks = new Set<(p: LegacyStreamPayload) => void>();
  const closeCallbacks = new Set<() => void>();
  let open = true;
  session.audio.onFrame((frame) => {
    if (!open) return;
    const payload: LegacyStreamPayload = {
      mediaSessionRef: session.sessionRef,
      streamRef,
      format: "WAV",
      type: "AUDIO_IN",
      data: frame
    };
    for (const cb of callbacks) cb(payload);
  });
  return {
    onPayload: (cb: (p: LegacyStreamPayload) => void) => void callbacks.add(cb),
    write: (payload: { data?: Uint8Array }) => {
      if (open && payload.data) session.audio.send(Buffer.from(payload.data));
    },
    close: () => {
      open = false;
      for (const cb of closeCallbacks) cb();
    },
    cleanup: (cb: () => void) => void closeCallbacks.add(cb)
  };
}

/** res.sgather(), rebuilt on turn and DTMF events (deprecated). */
function legacySgather(session: Session, options: { source?: string } = {}) {
  deprecated(
    "sgather",
    "session.on('turn.ended' | 'transcript.partial' | 'dtmf')"
  );
  const source = options.source ?? "speech";
  const started = Date.now();
  const callbacks = new Set<(p: LegacyStreamGatherPayload) => void>();
  const emit = (p: { speech?: string; digit?: string }) => {
    for (const cb of callbacks) {
      cb({
        mediaSessionRef: session.sessionRef,
        responseTime: Date.now() - started,
        ...p
      });
    }
  };
  const onSpeech = (e: { text: string }) => emit({ speech: e.text });
  const onDigit = (e: { digit: string }) => emit({ digit: e.digit });
  if (source.includes("speech")) {
    session.on("turn.ended", onSpeech);
    // Speech recognition starts with a Speech-layer command; an empty subscribe is one.
    void session.subscribe([]).catch(() => undefined);
  }
  if (source.includes("dtmf")) session.on("dtmf", onDigit);
  return {
    onPayload: (cb: (p: LegacyStreamGatherPayload) => void) =>
      void callbacks.add(cb),
    close: () => {
      session.off("turn.ended", onSpeech);
      session.off("dtmf", onDigit);
    }
  };
}

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
    /** @deprecated Use session.audio (onFrame, send, mark, clear). */
    stream: () => legacyStream(session),
    /** @deprecated Use session.on("turn.ended" | "transcript.partial" | "dtmf"). */
    sgather: (options?: { source?: string }) => legacySgather(session, options),
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
    unmute: removed("unmute", "use resume() after hold()")
  } as const;
}

export type LegacyResponse = Omit<
  ReturnType<typeof createLegacyResponse>,
  "record" | "setAudioFilters" | "mute" | "unmute"
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
