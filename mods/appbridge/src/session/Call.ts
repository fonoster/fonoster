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
import { randomUUID } from "crypto";
import {
  APP_COMMAND_SCHEMAS,
  AppCommandType,
  assertPublicDestination,
  E164,
  isSipTarget,
  Roomr,
  SESSION_PROTOCOL,
  SessionEndReason,
  SessionStart,
  sipHeadersProblem,
  SUBSCRIBABLE_EVENTS,
  Usage,
  Webhooks
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import Ajv, { ValidateFunction } from "ajv";
import WebSocket from "ws";
import { AmdClassifier, AmdListener, amdWindowMs } from "../amd/AmdListener";
import { FRAME_MS } from "../audio/pcm";
import {
  AppBridgeConfig,
  AppConfig,
  DEFAULTS,
  parseDurationMs,
  recordingPolicy
} from "../config";
import {
  AudioFilterChain,
  AudioFilterFactory,
  bufferToInt16,
  int16ToBuffer
} from "../filters";
import { ControlStream } from "../media/ControlStream";
import { OFFERED_CODEC, RtpLink } from "../media/RtpLink";
import { SRTP_SUITE } from "../media/srtp";
import { FonosterCodec } from "../protocols/fonoster";
import { TwilioCodec } from "../protocols/twilio";
import { ProtocolCodec } from "../protocols/types";
import { CallRecording } from "../record/CallRecording";
import { CallRecordSink } from "../record/CallRecordSink";
import { Catalog } from "../speech/Catalog";
import { SpeechError, SttStream } from "../speech/types";
import { telemetry } from "../telemetry";
import { createDetector } from "../turn/createDetector";
import { Detector, Estimate } from "../turn/Detector";
import { Pacing, Patience } from "../turn/Pacing";
import { TurnLabeler } from "../turn/TurnLabeler";
import { BufferedSocket, connectApp } from "./connectApp";
import { Listener } from "./Listener";
import { OutputEvent, OutputQueue } from "./OutputQueue";

const logger = getLogger({ service: "appbridge", filePath: __filename });

const ajv = new Ajv({ strict: false, allErrors: false });
const validators = Object.fromEntries(
  Object.entries(APP_COMMAND_SCHEMAS).map(([type, schema]) => [
    type,
    ajv.compile(schema)
  ])
) as Record<AppCommandType, ValidateFunction>;

/** Caller audio kept before speech starts: 25 frames of 20 ms. */
const RECENT_CALLER_FRAMES = 25;
/** Commands that start the Speech layer. */
const SPEECH_COMMANDS = new Set([
  "speak",
  "play",
  "subscribe",
  "listen.update"
]);

/** Recorded with every turn decision (turn-taking 2.8). */
const POLICY_VERSION = "default@2";

/** How often turn.estimate is sent to subscribers. */
const ESTIMATE_EVERY_MS = 100;

/** Commands an app may send while the caller is on hold (appbridge B24). */
const ALLOWED_ON_HOLD = new Set([
  "resume",
  "hangup",
  "transfer",
  "handoff",
  "record.note",
  "usage.report"
]);

/**
 * The node's `Ended` cause → the `session.end` reason (redesign-roomr 5.9, voice-session
 * "Session ending"). `removed` is the app's own hang-up (or an EndCall/EndRoom from the control
 * plane), unless the app transferred the call first. Busy, no answer and rejected end outbound
 * calls before any session opens; they and every cause AppBridge does not know map to `error`.
 */
export function sessionEndReason(
  cause: unknown,
  context: { transferred?: boolean } = {}
): SessionEndReason {
  switch (cause) {
    case "caller_hangup":
    case "callee_hangup":
      return "caller_hangup";
    case "removed":
      return context.transferred ? "transfer" : "app_hangup";
    case "max_duration":
      return "timeout";
    case "media_timeout":
    case "node_error":
    case "app_gone":
    default:
      return "error";
  }
}

/** Causes the call record keeps as they are, where they say more than the session reason. */
const RECORDED_CAUSES = new Set([
  "callee_hangup",
  "media_timeout",
  "node_error"
]);

/**
 * The call record's end reason: the session reason, except that the callee hanging up, the media
 * timeout and a node error stay so.
 */
export function recordEndReason(
  cause: unknown,
  context: { transferred?: boolean } = {}
): string {
  return RECORDED_CAUSES.has(String(cause))
    ? String(cause)
    : sessionEndReason(cause, context);
}

/** What the node's RTP may be silent for before AppBridge ends the call (task 15.1). */
export const MEDIA_TIMEOUT_MS = 15_000;

/** The control stream is gone: a command could not be sent. */
export class StreamClosedError extends Error {
  readonly code = "stream_closed";
  constructor(what: string) {
    super(`${what}: the call's control stream is closed`);
  }
}

export type CallInfo = {
  nodeId: string;
  roomRef: string;
  callRef: string;
  /** The caller's (or callee's) participant on the node, once ParticipantJoined names it. */
  callerRef: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  metadata: Record<string, unknown>;
  /** The node's RTP endpoint for the app leg (Start.media). */
  nodeMedia?: Roomr.MediaEndpoint;
  /** The trace context from Start's headers (`traceparent`): the call's span joins its trace. */
  traceparent?: string;
};

export type CallDeps = {
  config: AppBridgeConfig;
  /** The call's control stream to its Roomr node (redesign-roomr 5.3). */
  stream: ControlStream;
  catalog: Catalog;
  record: CallRecordSink;
  findApp: (ref: string) => AppConfig | undefined;
  webhooks?: (event: Webhooks.WebhookEvent) => void;
  /** Once per session and catalog id it resolved (registry usage and runtime warnings, LO-B11). */
  onCatalogUse?: (use: CatalogUse) => void;
  /** Classifies the caller's first seconds for apps with `amd` (add-roomr 4.3). */
  amd?: AmdClassifier;
  /**
   * The call reached an app (once, right after `call.started`): the control plane needs its
   * parties to send `call.ended` (`appbridge-lost`) if this AppBridge dies before the call ends.
   */
  onAnswered?: (call: Call) => void;
  onEnded: (call: Call) => void;
};

/** A session resolved a catalog id (published on `registry.used`). */
export type CatalogUse = {
  workspaceRef: string | null;
  appRef: string;
  sessionRef: string;
  callRef: string;
  /** The id the app or its config named. */
  id: string;
  /** What was used (the replacement, for a retired id). */
  resolvedId: string;
  event?: "provider.deprecated_used" | "provider.retired_used";
  replacement?: string;
  at: string;
};

/**
 * One call owned by this AppBridge: the room on the Roomr node, the RTP link and, at any time, at
 * most one app session (handoff replaces it). Speech, turn-taking and the output queue live
 * here, never in the Roomr node.
 */

/** Both apps belong to the same, known workspace (handoff never crosses workspaces, RV-B3). */
function sameWorkspace(a?: string, b?: string): boolean {
  return a !== undefined && b !== undefined && a === b;
}

export class Call {
  readonly startedAt = Date.now();
  private rtp = new RtpLink();
  private sessionParticipantRef?: string;
  /** AppBridge's own RTP endpoint, sent in Answer or Ready. */
  private localMedia?: Roomr.MediaEndpoint;
  /** Answer or Ready went out. */
  private taken = false;
  /** When the node's RTP was last heard (media timeout, task 15.1). */
  private lastRtpAt = 0;
  private mediaWatch?: ReturnType<typeof setInterval>;
  /** The app transferred the call: the node's `removed` then means `transfer`. */
  private transferred = false;
  private session?: AppSession;
  private ended = false;
  private hangingUp?: SessionEndReason;
  private seq = 0;
  private handoffs = 0;
  /** The first app that answered; set once its session starts (call.started). */
  private answeredBy?: AppConfig;
  private routedTo?: AppConfig;
  onHold = false;
  /** The platform's recording listener (call-record, recording policy). */
  readonly recording: CallRecording;
  /** The AMD listener while it runs. */
  private amd?: AmdListener;
  /** What the call consumed so far (add-usage-metering D1). */
  readonly usage = new Usage.CallUsage();
  /** When the first app answered; `call.seconds` count from here (D2). */
  private answeredAt?: number;
  private usageTimer?: ReturnType<typeof setInterval>;
  /** How the call started: a browser test or any other call (D9). */
  origin: "call" | "browser_test" = "call";

  private readonly span: ReturnType<typeof telemetry.startCall>;

  constructor(
    readonly info: CallInfo,
    private readonly deps: CallDeps
  ) {
    this.span = telemetry.startCall(
      info.callRef,
      "appbridge.call",
      undefined,
      info.traceparent
    );
    telemetry.count("fonoster.appbridge.calls.total");
    telemetry.log("info", "call started", { callRef: info.callRef });
    this.recording = new CallRecording(
      this,
      deps.record.recordingDir?.(info.callRef),
      deps.config.rtp
    );
    deps.stream.callRef = info.callRef;
    deps.stream.on("dtmf", (d: Roomr.SessionDtmf) => {
      this.record("event", { media: { type: "dtmf", ...d } });
      this.session?.callerDtmf(String(d.digit));
    });
    deps.stream.on("event", (kind: string, body: Record<string, unknown>) =>
      this.onStreamEvent(kind, body)
    );
    deps.stream.on("close", (ended?: { cause: string }) => {
      // A stream that closed without Ended: the node is gone (voice-session "Node lost").
      if (!ended) this.nodeLost();
    });
    deps.stream.listen();
  }

  get callRef() {
    return this.info.callRef;
  }

  /** A hang-up is in progress. */
  get isHangingUp() {
    return this.hangingUp !== undefined;
  }

  /** The workspace of the app currently running the call, when the app config names it. */
  get workspaceRef(): string | undefined {
    return this.session?.workspaceRef;
  }

  /**
   * The usage attribution of a vendor the call uses: the catalog id's provider, the id itself as
   * the model when it names one, and whose key the workspace uses for that provider.
   */
  vendorUsage(catalogId: string, workspaceRef?: string) {
    const provider = catalogId.split("/")[0];
    return {
      provider,
      ...(catalogId.includes("/") ? { model: catalogId } : {}),
      keySource: this.deps.catalog.usesWorkspaceKey(provider, workspaceRef)
        ? ("workspace" as const)
        : ("platform" as const)
    };
  }

  /** Counts the characters each TTS request sends to the vendor. */
  ttsUsage(voiceId: string, workspaceRef?: string) {
    const key = this.vendorUsage(voiceId, workspaceRef);
    return (characters: number) =>
      this.usage.add({ meter: "tts.characters", quantity: characters, ...key });
  }

  /**
   * Writes the call's usage so far into its record. Each snapshot holds all of it, so the last one
   * is the call's usage, also after a crash (design D1, Risks).
   */
  flushUsage(at = Date.now()) {
    const lines: Usage.UsageLine[] = this.usage.lines();
    if (this.answeredAt !== undefined) {
      const seconds = Math.round((at - this.answeredAt) / 1000);
      if (seconds > 0)
        lines.unshift({ meter: "call.seconds", quantity: seconds });
    }
    if (lines.length) this.record("event", { type: "usage.snapshot", lines });
  }

  nextCommandId(): string {
    return `gw-${this.info.callRef}-${++this.seq}`;
  }

  record(
    source: "app" | "appbridge" | "event",
    message: Record<string, unknown>
  ) {
    this.deps.record.append(this.info.callRef, {
      at: Date.now(),
      source,
      message
    });
  }

  /** Providers the app uses from the start (voice, STT, filters) whose workspace key was unreadable. */
  private unavailableProviders(app: AppConfig): string[] {
    const catalog = this.deps.catalog;
    const providers = new Set<string>(
      [
        app.speech.voice?.split("/")[0],
        catalog.sttProvider(app.speech.sttModel),
        ...(app.filters ?? []).map((f) => AudioFilterFactory.providerOf(f.name))
      ].filter((p): p is string => Boolean(p))
    );
    return [...providers].filter((p) =>
      catalog.keyUnavailable(p, app.workspaceRef)
    );
  }

  /** Runs an inbound or answered outbound call with its app. */
  async run(app: AppConfig) {
    this.routedTo = app;
    this.record("event", {
      type: "call.started",
      direction: this.info.direction,
      appRef: app.ref,
      workspaceRef: app.workspaceRef ?? null,
      from: this.info.from,
      to: this.info.to,
      origin: this.origin
    });
    // The workspace's own vendor keys, looked up once per session (registry 3.2).
    await this.deps.catalog.prepare(app.workspaceRef);
    // A key that could not be read never falls back to the platform's: a provider the app uses
    // from the start stops the call before it is answered (remove-platform-key-fallback D2).
    const unavailable = this.unavailableProviders(app);
    if (unavailable.length) {
      telemetry.count("fonoster.appbridge.keys.unavailable", 1, {
        provider: unavailable.join(",")
      });
      this.record("event", {
        type: "call.failed",
        reason: "key_unavailable",
        provider: unavailable.join(","),
        sipStatus: 503
      });
      this.deps.webhooks?.(
        Webhooks.callFailed(app.workspaceRef ?? "default", {
          ...this.parties(app),
          reason: "key_unavailable"
        })
      );
      if (this.info.direction === "inbound") await this.reject(503);
      else await this.hangup("error");
      return;
    }

    const reached = await this.dial(app);
    const socket = reached?.socket;
    if (this.ended) return socket?.terminate();

    try {
      await this.joinRoom();
      const policy = recordingPolicy(this.deps.config, reached?.app ?? app);
      if (reached && policy === "consent") {
        // The caller hears the consent prompt before recording starts and before the app's
        // session begins (call-record "Consent prompt").
        this.takeCall();
        await this.consentPrompt(reached.app);
        if (this.ended) return socket?.terminate();
        await this.startRecording(policy);
        this.attach(reached.app, reached.socket, null);
      } else {
        if (reached) void this.startRecording(policy);
        // Answer (or Ready) once the app's socket is open and session.start is sent (VS12,
        // voice-session "AppBridge answers on the stream").
        if (reached) this.attach(reached.app, reached.socket, null);
        this.takeCall();
      }
    } catch (e) {
      logger.error(
        `call ${this.callRef}: could not set up media: ${(e as Error).message}`
      );
      socket?.terminate();
      this.hangingUp = "error";
      this.deps.stream.hangup();
      return this.finish("error");
    }

    if (reached) void this.detectAnsweringMachine(reached.app);

    if (!socket) {
      this.failed("app_unreachable");
      await this.fallbackMessage(app);
    }
  }

  /**
   * AMD as a voice-worker listener: one RTP stream (the caller's track) to an AmdListener, then
   * `amd.result` to the session and the call record. Never affects the call itself.
   */
  private async detectAnsweringMachine(app: AppConfig) {
    const windowMs = amdWindowMs(app.amd);
    if (!windowMs || this.ended) return;
    const report = (result: Record<string, unknown>) => {
      const event = { type: "amd.result", ...result };
      this.record("event", event);
      this.session?.emit(event);
    };
    if (!this.deps.amd)
      return report({
        status: "unknown",
        confidence: 0,
        detector: "none",
        audioMs: 0,
        reason: "no_classifier"
      });
    const track = await this.recording.trackOf("caller");
    if (this.ended) return;
    if (track === undefined)
      return report({
        status: "unknown",
        confidence: 0,
        detector: "none",
        audioMs: 0,
        reason: "unknown_tracks"
      });
    const listener = new AmdListener(this, this.deps.amd, this.deps.config.rtp);
    this.amd = listener;
    this.record("event", { type: "amd.started", windowMs });
    const result = await listener.run(track, windowMs);
    this.amd = undefined;
    // A detection is metered when the classifier ran on the audio (add-usage-metering D3).
    if (result.detector !== "none") {
      this.usage.add({ meter: "amd.detections", quantity: 1 });
      this.usage.addMillis({ meter: "amd.seconds" }, result.audioMs);
    }
    report(result);
  }

  private async startRecording(policy: ReturnType<typeof recordingPolicy>) {
    if (policy === "off") return;
    await this.recording.start(policy);
  }

  /** Speaks the consent prompt alone (no app session yet) and resolves when it has played. */
  private async consentPrompt(app: AppConfig) {
    const text =
      this.deps.config.callRecord?.consentPrompt ??
      "This call will be recorded.";
    this.record("event", { type: "recording.consent_requested", text });
    const voice = this.deps.catalog.resolveVoice(
      app.speech.voice,
      app.workspaceRef
    );
    if (!voice) return;
    await new Promise<void>((resolve) => {
      const queue = new OutputQueue({
        sink: (f) => this.rtp.send(f),
        maxQueuedMs: DEFAULTS.outputQueueMaxMs,
        emit: (e) => {
          if (
            e.type === "output.done" ||
            e.type === "output.interrupted" ||
            e.type === "error"
          ) {
            queue.stop();
            resolve();
          }
        }
      });
      queue.start();
      queue.speak({
        id: "consent",
        text,
        last: true,
        interruptible: false,
        preempt: false,
        voice: voice.voice,
        language: app.speech.language,
        adapter: voice.adapter
      });
    });
  }

  private parties(app?: AppConfig) {
    return {
      callRef: this.info.callRef,
      appRef: app?.ref ?? "",
      from: this.info.from,
      to: this.info.to,
      direction: this.info.direction
    };
  }

  /** The answering app's parties and when the call started (for the session registry). */
  startedParties() {
    return {
      ...this.parties(this.answeredBy),
      startedAt: new Date(this.startedAt).toISOString()
    };
  }

  /** The call never reached an app: a minimal record and `call.failed` (appbridge B26). */
  failed(reason: string, sipStatus?: number) {
    if (this.answeredBy) return;
    this.record("event", { type: "call.failed", reason, sipStatus });
    this.deps.webhooks?.(
      Webhooks.callFailed(this.routedTo?.workspaceRef ?? "default", {
        ...this.parties(this.routedTo),
        reason
      })
    );
  }

  /**
   * Refuses the call with a SIP status: `Reject` on an inbound call the app has not answered,
   * `Hangup` otherwise (an outbound call is already answered by its callee).
   */
  async reject(sipStatus: number) {
    this.hangingUp = "error";
    if (this.info.direction === "inbound" && !this.taken)
      this.deps.stream.reject(sipStatus);
    else this.deps.stream.hangup(sipStatus);
    this.finish("error");
  }

  /**
   * The node's control stream closed without Ended (the node died, or keepalive declared it
   * dead): the call is gone (voice-session "Node lost").
   */
  nodeLost() {
    if (this.ended) return;
    this.record("event", { type: "call.failure", reason: "node_error" });
    if (!this.answeredBy) this.failed("node_error");
    this.finish("error", "node_error");
  }

  /** Dials the app, then its fallback app; returns undefined when only a message is left. */
  private async dial(
    app: AppConfig
  ): Promise<{ app: AppConfig; socket: WebSocket } | undefined> {
    const retry = this.deps.config.retry ?? {};
    const options = {
      windowMs: retry.windowMs ?? DEFAULTS.retryWindowMs,
      intervalMs: retry.intervalMs ?? DEFAULTS.retryIntervalMs,
      onFailure: (f: { url: string; reason: string }) =>
        this.record("event", {
          type: "app.connect_failed",
          url: f.url,
          reason: f.reason
        })
    };
    try {
      return { app, socket: await connectApp(app, options) };
    } catch {
      this.record("event", {
        type: "app.unreachable",
        appRef: app.ref,
        url: app.url
      });
      const fallback = app.fallback?.app
        ? this.deps.findApp(app.fallback.app)
        : undefined;
      if (fallback) {
        try {
          return { app: fallback, socket: await connectApp(fallback, options) };
        } catch {
          this.record("event", {
            type: "app.unreachable",
            appRef: fallback.ref,
            url: fallback.url
          });
        }
      }
      return undefined;
    }
  }

  /**
   * Binds AppBridge's RTP endpoint and points it at the node's (Start.media). With `rtp.srtp` the
   * leg is SRTP: our key goes in Answer or Ready and the node's key from Start decrypts what it
   * sends (redesign-roomr "Encrypted app leg"); without it the leg is plain RTP.
   */
  private async joinRoom() {
    const node = this.info.nodeMedia;
    if (!node?.ip || !node.port)
      throw new Error("Start carried no media endpoint");
    if (this.deps.config.rtp?.srtp) {
      if (!node.srtpKey)
        throw new Error("the node offered no srtp key on an encrypted leg");
      this.rtp.enableSrtp();
    }
    const offer = await this.rtp.bind(
      this.deps.config.rtp?.host ?? "127.0.0.1",
      this.deps.config.rtp?.advertiseHost
    );
    this.rtp.connect({
      host: node.ip,
      port: node.port,
      ...(this.rtp.secure
        ? { srtp: { suite: SRTP_SUITE, key: node.srtpKey! } }
        : {})
    });
    this.localMedia = {
      ip: offer.host,
      port: offer.port,
      codec: OFFERED_CODEC,
      ...(offer.srtp ? { srtpKey: offer.srtp.key } : {})
    };
    this.rtp.on("frame", (frame: Buffer) => {
      this.lastRtpAt = Date.now();
      this.session?.callerAudio(frame);
    });
  }

  /**
   * Takes the call on the node: `Answer` for an inbound call (the caller gets 200 OK), `Ready` for
   * an answered outbound one. From here the node's RTP must keep flowing (media timeout).
   */
  private takeCall() {
    if (this.taken || this.ended) return;
    const media = this.localMedia!;
    const sent =
      this.info.direction === "inbound"
        ? this.deps.stream.answer(media)
        : this.deps.stream.ready(media);
    if (!sent) throw new StreamClosedError("answer");
    this.taken = true;
    this.watchMedia();
  }

  /**
   * Ends the call when the node's RTP stops for `mediaTimeout` while the stream stays open
   * (task 15.1, voice-session "Node's audio stops"): the app gets `error`, the record says
   * `media_timeout`.
   */
  private watchMedia() {
    const timeoutMs = mediaTimeoutMs(this.deps.config);
    if (!timeoutMs) return;
    this.lastRtpAt = Date.now();
    this.mediaWatch = setInterval(
      () => {
        if (this.ended || Date.now() - this.lastRtpAt < timeoutMs) return;
        this.record("event", {
          type: "media.timeout",
          silentMs: Date.now() - this.lastRtpAt
        });
        this.hangingUp = "error";
        this.deps.stream.hangup();
        this.finish("error", "media_timeout");
      },
      Math.min(1000, Math.max(50, Math.floor(timeoutMs / 4)))
    );
    this.mediaWatch.unref?.();
  }

  /** No app could be reached: speak the fallback message, if any, then hang up. */
  private async fallbackMessage(app: AppConfig) {
    const message = app.fallback?.message;
    const voice = message
      ? this.deps.catalog.resolveVoice(app.speech.voice, app.workspaceRef)
      : undefined;
    if (!message || !voice) return this.hangup("error");
    const queue = new OutputQueue({
      sink: (f) => this.rtp.send(f),
      maxQueuedMs: DEFAULTS.outputQueueMaxMs,
      emit: (e) => {
        if (
          e.type === "output.done" ||
          e.type === "output.interrupted" ||
          e.type === "error"
        ) {
          queue.stop();
          void this.hangup("error");
        }
      }
    });
    queue.start();
    queue.speak({
      id: "fallback",
      text: message,
      last: true,
      interruptible: false,
      preempt: false,
      voice: voice.voice,
      language: app.speech.language,
      adapter: voice.adapter,
      onSynthesize: this.ttsUsage(voice.id, app.workspaceRef)
    });
  }

  /** Starts an app session on an open socket. */
  attach(
    app: AppConfig,
    socket: WebSocket,
    handoff: Record<string, unknown> | null
  ) {
    if (!this.answeredBy) {
      this.answeredBy = app;
      this.answeredAt = Date.now();
      this.usageTimer = setInterval(() => this.flushUsage(), 60_000);
      this.usageTimer.unref?.();
      this.deps.webhooks?.(
        Webhooks.callStarted(app.workspaceRef ?? "default", this.parties(app))
      );
      this.deps.onAnswered?.(this);
    }
    this.session = new AppSession(this, app, socket, handoff, this.deps, (f) =>
      this.rtp.send(f)
    );
    this.session.start();
  }

  /** Sends one command on the control stream (the node runs them in order). */
  command(message: Roomr.AppMessage) {
    if (!this.deps.stream.send(message))
      throw new StreamClosedError(
        Roomr.messageType(message, Roomr.APP_MESSAGE_TYPES) ?? "command"
      );
  }

  /** Attaches a listen-only fork of some tracks (recording, AMD); resolves with its ref. */
  async addListener(listen: Roomr.ListenTrack[]): Promise<string> {
    const listenerRef = randomUUID();
    this.command({ addListener: { listenerRef, listen } });
    return listenerRef;
  }

  async removeListener(listenerRef: string) {
    this.command({ removeListener: { listenerRef } });
  }

  get callerParticipantRef() {
    return this.info.callerRef;
  }

  get sessionParticipant() {
    return this.sessionParticipantRef;
  }

  /** Hands the call to another app (VS8). The caller stays connected. */
  /** Checks handoff limits before the current session is ended; returns a reason when refused. */
  handoffRefusal(payload: Record<string, unknown>): string | undefined {
    if (this.handoffs >= DEFAULTS.maxHandoffsPerCall) {
      return `at most ${DEFAULTS.maxHandoffsPerCall} handoffs per call`;
    }
    if (
      Buffer.byteLength(JSON.stringify(payload)) >
      DEFAULTS.maxHandoffPayloadBytes
    ) {
      return `handoff payload exceeds ${DEFAULTS.maxHandoffPayloadBytes} bytes`;
    }
    return undefined;
  }

  async handoff(
    appRef: string,
    payload: Record<string, unknown>,
    fromWorkspaceRef: string | undefined
  ) {
    const target = this.deps.findApp(appRef);
    if (!target || !sameWorkspace(fromWorkspaceRef, target.workspaceRef))
      return false;
    this.handoffs++;
    await this.deps.catalog.prepare(target.workspaceRef);
    const reached = await this.dial(target);
    if (!reached) return false;
    this.record("event", { type: "handoff", to: reached.app.ref });
    this.attach(reached.app, reached.socket, payload);
    return true;
  }

  /** Hangs the call up on the node and ends the session with a reason. */
  async hangup(reason: SessionEndReason) {
    if (this.ended || this.hangingUp) return;
    this.hangingUp = reason;
    if (!this.deps.stream.hangup())
      logger.warn(`call ${this.callRef}: hangup failed: stream closed`);
    this.finish(reason);
  }

  /**
   * Ends everything locally: session, speech, RTP, subscriptions. `recordReason` is what the call
   * record keeps when it says more than the session reason (e.g. `callee_hangup`: the dialed
   * party of an outbound call hung up; the app still gets `caller_hangup`).
   */
  finish(reason: SessionEndReason, recordReason: string = reason) {
    if (this.ended) return;
    this.ended = true;
    this.session?.end(reason);
    this.session = undefined;
    this.rtp.close();
    clearInterval(this.mediaWatch);
    // Our side of the stream closes; the node ends the call if it still runs.
    this.deps.stream.close();
    // The recording is flushed before the record is closed, so sealing finds all of it.
    this.recording.stop();
    this.amd?.stop();
    clearInterval(this.usageTimer);
    this.flushUsage();
    this.record("event", { type: "call.ended", reason: recordReason });
    if (this.answeredBy)
      this.deps.webhooks?.(
        Webhooks.callEnded(this.answeredBy.workspaceRef ?? "default", {
          ...this.parties(this.answeredBy),
          // Until the room ends, even after a cold transfer (B26).
          durationSeconds: Math.round((Date.now() - this.startedAt) / 1000),
          endReason: reason
        })
      );
    this.deps.record.close(this.info.callRef);
    telemetry.log("info", `call ended: ${reason}`, {
      callRef: this.info.callRef
    });
    this.span.end({ "fonoster.end_reason": String(reason) });
    this.deps.onEnded(this);
  }

  sessionDetached(session: AppSession, reason?: SessionEndReason) {
    if (reason === "transfer") this.appLegGone();
    if (this.session === session) this.session = undefined;
  }

  /**
   * One event from the node's stream. After Answer or Ready the node reports the caller's leg
   * joining, then the app's leg (`p-app-…`); their track ids feed the recording and AMD listeners.
   */
  private onStreamEvent(kind: string, body: Record<string, unknown>) {
    this.record("event", { media: { type: kind, ...body } });
    switch (kind) {
      case "participantJoined": {
        const ref = String(body.participantRef ?? "");
        const trackId = Number(body.trackId);
        if (!this.sessionParticipantRef && ref.startsWith("p-app")) {
          this.sessionParticipantRef = ref;
          this.recording.noteTrack("app", trackId);
        } else if (!this.info.callerRef && this.taken) {
          this.info.callerRef = ref;
          this.recording.noteTrack("caller", trackId);
        } else if (!this.sessionParticipantRef && this.taken) {
          this.sessionParticipantRef = ref;
          this.recording.noteTrack("app", trackId);
        }
        break;
      }
      case "participantLeft":
        // The node removed the app's leg (a transfer completed).
        if (body.participantRef === this.sessionParticipantRef) {
          this.appLegGone();
          this.session?.leftRoom();
        }
        break;
      case "transferResult":
        this.session?.transferResult({
          status: body.status,
          reason: body.cause || undefined,
          sipStatus: body.sipStatus || undefined
        });
        break;
      case "ended":
        this.onEnded(String(body.cause ?? ""), body.sipStatus as number);
        break;
    }
  }

  /**
   * The app's leg left the room after a transfer: the call goes on between the caller and the new
   * party until the node's Ended, and the node sends this leg no more RTP (no media timeout).
   */
  private appLegGone() {
    this.transferred = true;
    clearInterval(this.mediaWatch);
  }

  /** The node ended the call (Ended): the session ends with the mapped reason (task 5.9). */
  private onEnded(cause: string, sipStatus?: number) {
    if (this.ended) return;
    if (!this.answeredBy && cause && cause !== "removed" && !this.hangingUp)
      this.failed(cause, sipStatus || undefined);
    const transferred =
      this.transferred || Boolean(this.session?.pendingTransferEnd);
    if (this.hangingUp) return this.finish(this.hangingUp);
    this.finish(
      sessionEndReason(cause, { transferred }),
      recordEndReason(cause, { transferred })
    );
  }
}

/** `mediaTimeout` from appbridge.yaml in ms (default 15 s; 0 turns the check off). */
export function mediaTimeoutMs(config: AppBridgeConfig): number {
  const v = config.mediaTimeout;
  if (v === undefined) return MEDIA_TIMEOUT_MS;
  return parseDurationMs(v);
}

type PendingTransfer = { id: string; mode: string };

/** One app's session on a call (until hangup, transfer or handoff). */
export class AppSession {
  readonly sessionRef = randomUUID();

  get workspaceRef() {
    return this.app.workspaceRef;
  }
  private codec: ProtocolCodec;
  private queue: OutputQueue;
  private stt?: SttStream;
  private pacing?: Pacing;
  private detector?: Detector;
  private detectorVersion = "baseline@1";
  private subscriptions = new Set<string>();
  private lastEstimateAt = 0;
  private closed = false;
  private transfer?: PendingTransfer;
  private listeners: Listener[] = [];
  private keepalive?: ReturnType<typeof setInterval>;
  private filters?: AudioFilterChain;
  /** The STT vendor this session sends audio to, for `stt.seconds`. */
  private sttUsage?: ReturnType<Call["vendorUsage"]> & { meter: "stt.seconds" };
  /** The noise-cancelling vendors filtering the caller, by filter name, for `nc.seconds`. */
  private readonly ncUsage = new Map<
    string,
    ReturnType<Call["vendorUsage"]> & { meter: "nc.seconds" }
  >();
  private lastEstimate?: Estimate;
  private speechStarted = false;
  /** The last 500 ms of caller audio, for STT when speech starts late. */
  private recentCaller: Buffer[] = [];
  private reportedIds = new Set<string>();
  private usedIds = new Set<string>();
  private labeler = new TurnLabeler((label) =>
    this.call.record("event", { type: "turn.label", ...label })
  );
  private filtering: Promise<void> = Promise.resolve();
  pendingTransferEnd = false;

  constructor(
    private readonly call: Call,
    private readonly app: AppConfig,
    private readonly socket: WebSocket,
    private readonly handoffPayload: Record<string, unknown> | null,
    private readonly deps: CallDeps,
    sink: (frame: Buffer) => void
  ) {
    const send = (data: string | Buffer) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
    };
    this.codec =
      app.protocol === "twilio"
        ? new TwilioCodec(
            send,
            app.workspaceRef ??
              deps.config.http?.accountSid ??
              "AC00000000000000000000000000000000"
          )
        : new FonosterCodec(send, app.audio ?? { codec: "pcm16", rate: 16000 });
    this.queue = new OutputQueue({
      sink: (frame) => {
        sink(frame);
        for (const l of this.listeners) l.agentAudio(frame);
      },
      emit: (e) => this.onOutput(e),
      maxQueuedMs: deps.config.outputQueueMaxMs ?? DEFAULTS.outputQueueMaxMs
    });
  }

  start() {
    const info = this.call.info;
    // Validated against the format menu (APP_AUDIO_FORMATS) when the app is loaded.
    const audio = (this.app.audio ?? {
      codec: "pcm16",
      rate: 16000
    }) as SessionStart["audio"];
    const start: SessionStart = {
      type: "session.start",
      protocol: SESSION_PROTOCOL,
      sessionRef: this.sessionRef,
      callRef: info.callRef,
      appRef: this.app.ref,
      direction: info.direction,
      from: info.from,
      to: info.to,
      metadata: info.metadata,
      handoff: this.handoffPayload,
      ...(telemetry.traceparent(info.callRef)
        ? { traceparent: telemetry.traceparent(info.callRef) }
        : {}),
      audio,
      tracks: [
        { id: 1, side: "inbound", kind: "audio", codec: audio.codec },
        { id: 2, side: "outbound", kind: "audio", codec: audio.codec }
      ],
      speech: {
        voice: this.app.speech.voice,
        language: this.app.speech.language
      }
    };

    this.socket.on("message", (raw: WebSocket.Data, isBinary: boolean) =>
      this.onFrame(raw as Buffer, isBinary)
    );
    const early = (this.socket as BufferedSocket).takeEarlyFrames?.() ?? [];
    this.socket.on("close", () => this.onSocketClosed());
    this.socket.on("error", () => undefined);
    this.startKeepalive();

    this.codec.start(start);
    this.call.record("appbridge", start as unknown as Record<string, unknown>);
    for (const f of early) this.onFrame(f.data as Buffer, f.isBinary);
    void this.addListeners(start);
    this.queue.start();
    // Speech recognition starts with the app's first Speech-layer command, so audio-only apps
    // never pay for it (build log B18).
  }

  /** Starts STT, filters and turn-taking once, replaying the caller audio kept so far. */
  private ensureSpeech() {
    if (this.speechStarted || !this.codec.speechLayer || this.closed) return;
    this.speechStarted = true;
    void this.startFilters();
    this.startSpeech();
    for (const frame of this.recentCaller) this.toStt(frame);
    this.recentCaller = [];
  }

  /** Pings the app; a socket that answers nothing for the idle timeout counts as dropped. */
  private startKeepalive() {
    const k = this.deps.config.keepalive ?? {};
    const interval = k.pingIntervalMs ?? DEFAULTS.pingIntervalMs;
    const idle = k.idleTimeoutMs ?? DEFAULTS.idleTimeoutMs;
    let lastHeard = Date.now();
    const heard = () => (lastHeard = Date.now());
    this.socket.on("pong", heard);
    this.socket.on("message", heard);
    this.keepalive = setInterval(() => {
      if (Date.now() - lastHeard > idle) {
        this.call.record("event", {
          type: "app.idle_timeout",
          sessionRef: this.sessionRef
        });
        this.socket.terminate();
        return;
      }
      if (this.socket.readyState === WebSocket.OPEN) this.socket.ping();
    }, interval);
  }

  private async addListeners(start: SessionStart) {
    const audio = this.app.audio ?? { codec: "pcm16", rate: 16000 };
    for (const config of (this.app.listeners ?? []).slice(0, 4)) {
      try {
        const socket = await Listener.connect(
          config.url,
          this.app.signingSecret,
          { appRef: this.app.ref, workspaceRef: this.app.workspaceRef },
          undefined,
          this.app.publicDestinationsOnly?.listeners ?? false
        );
        if (this.closed) {
          socket.close();
          return;
        }
        const listener = new Listener(
          socket,
          config.tracks ?? "inbound",
          audio,
          (cmd) =>
            listener.json({
              type: "error",
              code: "read_only",
              message: "listen-only sockets cannot send commands",
              fatal: false,
              ...(typeof cmd.id === "string" ? { relatesTo: cmd.id } : {})
            })
        );
        listener.start(start);
        this.listeners.push(listener);
        this.call.record("event", {
          type: "listener.attached",
          url: config.url,
          tracks: config.tracks ?? "inbound"
        });
      } catch (e) {
        this.call.record("event", {
          type: "listener.failed",
          url: config.url,
          reason: (e as Error).message
        });
      }
    }
  }

  /**
   * Builds the app's filter chain. A filter that needs a vendor credential gets the one resolved
   * for the session's workspace (its own key, else the platform key). A filter that cannot be
   * created, cannot start or fails mid-call degrades to unfiltered audio and is recorded
   * (voice-session, "Audio filters come from app configuration").
   */
  private async startFilters() {
    const configs = this.app.filters ?? [];
    if (!configs.length) return;
    const failed = (name: string | undefined, reason: string) => {
      // A filter that failed open no longer filters, so it stops counting.
      if (name) this.ncUsage.delete(name);
      else this.ncUsage.clear();
      this.call.record("event", {
        type: "filter.failed",
        ...(name ? { name } : {}),
        reason
      });
    };
    try {
      // The operator's server-side options (model paths), then the provider credential.
      const trustedOverlay: Record<string, Record<string, unknown>> = {};
      const serverOptions = this.deps.config.audioFilters ?? {};
      const usable = configs.filter((c) => {
        if (serverOptions[c.name])
          trustedOverlay[c.name] = { ...serverOptions[c.name] };
        const provider = AudioFilterFactory.providerOf(c.name);
        if (!provider) return true;
        const license = this.deps.catalog.credentialFor(
          provider,
          this.app.workspaceRef
        );
        if (!license) {
          failed(
            c.name,
            `no credential for provider ${provider}: add a key on the Vendor keys page or set providers.${provider}.credential in gateway.yaml`
          );
          return false;
        }
        trustedOverlay[c.name] = { ...trustedOverlay[c.name], license };
        return true;
      });
      if (!usable.length) return;
      usable.forEach((c) => {
        const provider = AudioFilterFactory.providerOf(c.name);
        if (provider)
          this.ncUsage.set(c.name, {
            meter: "nc.seconds",
            ...this.call.vendorUsage(provider, this.app.workspaceRef)
          });
      });
      const chain = AudioFilterFactory.createChainFromConfig(usable, {
        trustedOverlay,
        onDisabled: failed
      });
      await chain.ready();
      if (this.closed) return chain.close();
      this.filters = chain;
    } catch (e) {
      failed(undefined, (e as Error).message);
    }
  }

  private startSpeech() {
    const language = this.app.speech.language;
    const chosen = createDetector(
      {
        silenceTimeoutMs:
          this.app.speech.silenceTimeoutMs ?? DEFAULTS.silenceTimeoutMs,
        detector: this.app.speech.detector
      },
      {
        onSource: (source, reason) =>
          this.call.record("event", { type: "detector.source", source, reason })
      }
    );
    this.detector = chosen.detector;
    this.detectorVersion = chosen.version;
    this.pacing = new Pacing(
      this.detector,
      {
        turn: (e) => {
          // The decision, with the estimate behind it and the versions that made it (2.8).
          this.call.record("event", {
            type: "turn.decision",
            event: e.type,
            ...this.lastEstimate,
            detector: this.detectorVersion,
            policy: POLICY_VERSION
          });
          if (e.type === "turn.ended") this.labeler.turnEnded(Date.now());
          if (e.type === "turn.backchannel")
            this.labeler.backchannel(Date.now());
          this.emit(e);
        },
        partial: (text, lang) => {
          if (this.subscriptions.has("transcript.partial"))
            this.emit({ type: "transcript.partial", text, language: lang });
        },
        estimate: (e) => {
          this.lastEstimate = e;
          this.labeler.estimate(e, Date.now());
          if (!this.subscriptions.has("turn.estimate")) return;
          const now = Date.now();
          if (now - this.lastEstimateAt < ESTIMATE_EVERY_MS) return;
          this.lastEstimateAt = now;
          this.emit({
            type: "turn.estimate",
            eot: Math.round(e.eot * 1000) / 1000,
            speaking: e.speaking,
            kind: e.kind
          });
        },
        // The app owns interruption (B22): AppBridge only reports turn.user_started.
        interruption: () => this.labeler.interruption(Date.now()),
        patience: (change) =>
          this.call.record("event", { type: "turn.patience", ...change })
      },
      { language, patience: this.app.speech.patience }
    );
    this.queue.onPlaying((playing) => this.pacing?.onOutput(playing));

    // The app's STT model (catalog id) and default hints (VO-B3, VO-B4).
    const sttId = this.app.speech.sttModel;
    const stt = this.deps.catalog.resolveStt(sttId, this.app.workspaceRef);
    if (!stt) {
      if (sttId)
        this.emit({
          type: "error",
          code: "invalid_catalog_id",
          message: `STT model ${sttId} is not in the catalog`,
          fatal: false
        });
      return;
    }
    if (sttId) this.noteCatalogUse(sttId, stt);
    if (stt.event && sttId) {
      this.reportedIds.add(sttId);
      this.call.record("event", {
        type: stt.event,
        id: sttId,
        replacement: stt.replacement,
        sessionRef: this.sessionRef,
        appRef: this.app.ref
      });
    }
    this.stt = stt.adapter.open({
      language,
      hints: mergeHints(this.app.speech.hints),
      model: stt.model
    });
    const sttCatalogId = stt.id ?? sttId ?? stt.provider;
    if (sttCatalogId)
      this.sttUsage = {
        meter: "stt.seconds",
        ...this.call.vendorUsage(sttCatalogId, this.app.workspaceRef)
      };
    this.stt.on("transcript", (t) => this.pacing?.onTranscript(t, Date.now()));
    this.stt.on("error", (e: SpeechError) =>
      this.emit({
        type: "error",
        code: e.code,
        message: `speech recognition: ${e.message}`,
        fatal: false
      })
    );
  }

  // ---- from the call -----------------------------------------------------------------

  callerAudio(frame: Buffer) {
    // On hold the app hears nothing and gets no turn events (B24).
    if (this.closed || this.call.onHold) return;
    this.codec.callerAudio(frame);
    for (const l of this.listeners) l.callerAudio(frame);
    if (!this.speechStarted) {
      this.recentCaller.push(frame);
      if (this.recentCaller.length > RECENT_CALLER_FRAMES)
        this.recentCaller.shift();
      return;
    }
    const chain = this.filters;
    if (!chain) return this.hear(frame, Date.now());
    // Filters are asynchronous; a promise chain keeps frames in order.
    const at = Date.now();
    this.filtering = this.filtering
      .then(() => chain.process(bufferToInt16(frame)))
      .then((out) => {
        this.ncUsage.forEach((key) => this.call.usage.addMillis(key, FRAME_MS));
        this.hear(int16ToBuffer(out), at);
      })
      .catch(() => this.hear(frame, at));
  }

  private closeFilters() {
    const chain = this.filters;
    this.filters = undefined;
    if (chain) void chain.drain().finally(() => chain.close());
  }

  /** Caller audio after filtering: what speech recognition and turn detection get. */
  /** Sends caller audio to the STT vendor, counting what it is sent (stt.seconds). */
  private toStt(frame: Buffer) {
    if (!this.stt) return;
    if (this.sttUsage) this.call.usage.addMillis(this.sttUsage, FRAME_MS);
    this.stt.write(frame);
  }

  private hear(frame: Buffer, at: number) {
    if (this.closed) return;
    this.toStt(frame);
    this.pacing?.onAudio(frame, at);
  }

  callerDtmf(digit: string) {
    this.emit({ type: "dtmf", digit });
  }

  /** The node removed our session participant (cold transfer completed). */
  leftRoom() {
    if (this.transfer) this.endWith("transfer");
  }

  transferResult(event: Record<string, unknown>) {
    const pending = this.transfer;
    if (!pending) return;
    if (event.status === "failed") {
      this.transfer = undefined;
      this.emit({
        type: "error",
        code: "transfer_failed",
        message: `transfer failed: ${event.reason ?? "unknown"}`,
        fatal: false,
        relatesTo: pending.id
      });
      return;
    }
    if (event.status === "referred") {
      this.pendingTransferEnd = true;
      this.endWith("transfer");
    } else if (event.status === "completed" && pending.mode === "cold") {
      this.endWith("transfer");
    }
  }

  /** Ends the session (the call may continue, e.g. after a transfer). */
  end(reason: SessionEndReason) {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.keepalive);
    this.labeler.stop();
    this.closeFilters();
    this.queue.stop();
    this.stt?.close();
    this.detector?.close?.();
    const end = { type: "session.end", reason };
    for (const l of this.listeners) {
      l.json(end);
      l.close();
    }
    this.listeners = [];
    if (this.socket.readyState === WebSocket.OPEN) {
      this.codec.end(end);
      this.call.record("appbridge", end);
      this.socket.close(1000);
    }
    this.call.sessionDetached(this, reason);
  }

  private endWith(reason: SessionEndReason) {
    this.end(reason);
    if (reason === "transfer")
      this.call.record("event", { type: "session.transferred" });
  }

  // ---- from the app ------------------------------------------------------------------

  private onSocketClosed() {
    if (this.closed) return;
    // A socket closed while the call is already hanging up (an app that asks for the hang-up and
    // closes at once, as Pipecat's auto_hang_up does) is not a drop.
    const hangingUp = this.call.isHangingUp;
    // The app dropped mid-call: hang up (VS11).
    if (!hangingUp)
      this.call.record("event", {
        type: "app.dropped",
        sessionRef: this.sessionRef
      });
    for (const l of this.listeners) l.close();
    this.listeners = [];
    this.closed = true;
    clearInterval(this.keepalive);
    this.labeler.stop();
    this.closeFilters();
    this.queue.stop();
    this.stt?.close();
    this.detector?.close?.();
    this.call.sessionDetached(this);
    if (!hangingUp) void this.call.hangup("app_hangup");
  }

  private onFrame(raw: Buffer, isBinary: boolean) {
    if (this.closed) return;
    const incoming = this.codec.parse(raw, isBinary);
    switch (incoming.kind) {
      case "audio":
        this.queue.audio(incoming.audio);
        return;
      case "bad":
        this.emit({
          type: "error",
          code: "bad_message",
          message: incoming.reason,
          fatal: false
        });
        return;
      case "ignore":
        return;
      case "command":
        this.call.record("app", incoming.command);
        void this.onCommand(incoming.command);
    }
  }

  /**
   * Hold and transfer music is a URL the app chose and the Roomr node fetches, so it is checked
   * here, where it enters the platform: http(s) only, public destinations only (the same rule as
   * Play media and webhooks; FONOSTER_ALLOWED_DESTINATIONS lists exceptions). The Roomr node
   * itself fetches whatever it is told.
   */
  private async musicAllowed(music: unknown, relatesTo?: string) {
    if (typeof music !== "string" || !music) return true;
    try {
      await assertPublicDestination(music);
      return true;
    } catch (e) {
      this.emit({
        type: "error",
        code: "bad_message",
        message: `music: ${(e as Error).message}`,
        fatal: false,
        relatesTo
      });
      return false;
    }
  }

  private async onCommand(cmd: Record<string, unknown>) {
    const type = cmd.type as AppCommandType;
    const validate = validators[type];
    // Unknown types are ignored (additive-only versioning).
    if (!validate) return;
    const relatesTo = typeof cmd.id === "string" ? cmd.id : undefined;
    if (!validate(cmd)) {
      const why = validate.errors
        ?.map((e) => `${e.instancePath || type} ${e.message}`)
        .join("; ");
      this.emit({
        type: "error",
        code: "bad_message",
        message: `invalid ${type}: ${why}`,
        fatal: false,
        relatesTo
      });
      return;
    }
    if (!this.codec.speechLayer && !["mark", "clear"].includes(type)) return;
    if (this.call.onHold && !ALLOWED_ON_HOLD.has(type)) {
      this.emit({
        type: "error",
        code: "on_hold",
        message: `${type} is not allowed while the caller is on hold`,
        fatal: false,
        relatesTo
      });
      return;
    }

    if (SPEECH_COMMANDS.has(type)) this.ensureSpeech();
    try {
      await this.dispatch(type, cmd, relatesTo);
    } catch (e) {
      const detail = e instanceof StreamClosedError ? ` (${e.code})` : "";
      this.emit({
        type: "error",
        code: "internal",
        message: `${type} failed${detail}: ${(e as Error).message}`,
        fatal: false,
        relatesTo
      });
    }
  }

  /**
   * A transfer's headers: the app's custom ones plus the call's own workspace and number, so a
   * transfer to the PSTN leaves by this workspace's trunk (X-Dod-Number picks it at Routr): the
   * ingress number of an inbound call, the `from` of an outbound one.
   */
  private transferHeaders(
    headers: Record<string, string> | undefined
  ): Record<string, string> {
    const { direction, from, to } = this.call.info;
    const number = direction === "inbound" ? to : from;
    return {
      ...(headers ?? {}),
      ...(number && E164.test(number) ? { "X-Dod-Number": number } : {}),
      ...(this.app.workspaceRef
        ? { "X-Access-Key-Id": this.app.workspaceRef }
        : {})
    };
  }

  private async dispatch(
    type: AppCommandType,
    cmd: Record<string, unknown>,
    id?: string
  ) {
    switch (type) {
      case "speak": {
        const voiceId = (cmd.voice as string) ?? this.app.speech.voice;
        const voice = this.deps.catalog.resolveVoice(
          voiceId,
          this.app.workspaceRef
        );
        if (!voice) {
          const provider = voiceId?.split("/")[0];
          const unreadable =
            provider &&
            this.deps.catalog.keyUnavailable(provider, this.app.workspaceRef);
          this.emit({
            type: "error",
            code: unreadable ? "key_unavailable" : "invalid_catalog_id",
            message: unreadable
              ? `the workspace's ${provider} key could not be read`
              : `voice ${voiceId} is not in the catalog`,
            fatal: false,
            relatesTo: id
          });
          return;
        }
        this.noteCatalogUse(voiceId, voice);
        if (voice.event && !this.reportedIds.has(voiceId)) {
          // Once per session and id (add-provider-registry, "Runtime use is caught").
          this.reportedIds.add(voiceId);
          this.call.record("event", {
            type: voice.event,
            id: voiceId,
            replacement: voice.replacement,
            sessionRef: this.sessionRef,
            appRef: this.app.ref
          });
        }
        if (cmd.preempt) this.labeler.outputCleared(Date.now());
        this.queue.speak({
          id: id ?? this.call.nextCommandId(),
          text: cmd.text as string,
          last: (cmd.last as boolean) ?? true,
          interruptible: (cmd.interruptible as boolean) ?? true,
          preempt: (cmd.preempt as boolean) ?? false,
          voice: voice.voice,
          language: (cmd.language as string) ?? this.app.speech.language,
          adapter: voice.adapter,
          onSynthesize: this.call.ttsUsage(voice.id, this.app.workspaceRef)
        });
        return;
      }
      case "play":
        if (cmd.preempt) this.labeler.outputCleared(Date.now());
        this.queue.play({
          id: id ?? this.call.nextCommandId(),
          url: cmd.url as string,
          loop: (cmd.loop as boolean) ?? false,
          interruptible: (cmd.interruptible as boolean) ?? true,
          preempt: (cmd.preempt as boolean) ?? false
        });
        return;
      case "mark":
        this.queue.mark(cmd.name as string);
        return;
      case "clear":
        this.labeler.outputCleared(Date.now());
        this.queue.clear();
        return;
      case "subscribe":
        for (const e of cmd.events as string[]) {
          if ((SUBSCRIBABLE_EVENTS as readonly string[]).includes(e))
            this.subscriptions.add(e);
        }
        return;
      case "listen.update":
        // An empty listen.update only starts listening (ensureSpeech above).
        if (cmd.patience) this.pacing?.setPatience(cmd.patience as Patience);
        if (!cmd.language && !cmd.hints) return;
        if (cmd.language) this.pacing?.setLanguage(cmd.language as string);
        this.stt?.update({
          language: cmd.language as string,
          // Session hints add to the app's default hints (VO-B3).
          hints: cmd.hints
            ? mergeHints(this.app.speech.hints, cmd.hints as string[])
            : undefined
        });
        return;
      case "hangup":
        await this.call.hangup("app_hangup");
        return;
      case "dtmf.send":
        this.call.command({ sendDtmf: { digits: String(cmd.digits) } });
        return;
      case "hold":
        if (!(await this.musicAllowed(cmd.music, id))) return;
        this.call.command({
          hold: cmd.music ? { music: String(cmd.music) } : {}
        });
        this.call.onHold = true;
        return;
      case "resume":
        this.call.command({ resume: {} });
        this.call.onHold = false;
        return;
      case "transfer": {
        const transferId = id ?? this.call.nextCommandId();
        const mode = (cmd.mode as string) ?? "cold";
        // The target and headers go into the INVITE or REFER as they are (security review H11):
        // only a plain target and custom X- headers without control characters; the headers the
        // platform routes by are set here, never by the app.
        const refusal = !isSipTarget(cmd.to)
          ? `invalid transfer target ${JSON.stringify(cmd.to)}`
          : sipHeadersProblem(cmd.headers);
        if (refusal) {
          this.emit({
            type: "error",
            code: "bad_message",
            message: refusal,
            fatal: false,
            relatesTo: transferId
          });
          return;
        }
        if (!(await this.musicAllowed(cmd.music, transferId))) return;
        this.transfer = { id: transferId, mode };
        try {
          // The node dials `to` through its outbound proxy (or REFERs it), with the headers.
          this.call.command({
            transfer: {
              to: {
                uri: cmd.to as string,
                headers: this.transferHeaders(
                  cmd.headers as Record<string, string> | undefined
                )
              },
              mode: mode as "cold" | "warm" | "refer",
              ...(cmd.music ? { music: String(cmd.music) } : {})
            }
          });
        } catch (e) {
          this.transfer = undefined;
          this.emit({
            type: "error",
            code: "transfer_failed",
            message: (e as Error).message,
            fatal: false,
            relatesTo: transferId
          });
        }
        return;
      }
      case "transfer.complete":
        if (
          !this.transfer ||
          this.transfer.id !== id ||
          this.transfer.mode !== "warm"
        ) {
          this.emit({
            type: "error",
            code: "bad_message",
            message: `no warm transfer ${id} in progress`,
            fatal: false,
            relatesTo: id
          });
          return;
        }
        this.call.command({ transferComplete: {} });
        this.endWith("transfer");
        return;
      case "record.note":
        // Already appended to the call record with every app message (2.10); only the size is
        // checked here (voice-session, "Apps can annotate the call record").
        if (Buffer.byteLength(JSON.stringify(cmd.data)) > 16 * 1024) {
          this.emit({
            type: "error",
            code: "bad_message",
            message: "record.note data exceeds 16 KB",
            fatal: false,
            relatesTo: id
          });
        }
        return;
      case "usage.report": {
        // Autopilot's model tokens join the call's usage (voice-session, "Autopilot reports
        // model usage to the call"); the schema already limits the meters.
        if (this.app.type !== "AUTOPILOT") {
          this.emit({
            type: "error",
            code: "bad_message",
            message: "usage.report is reserved for Autopilot agents",
            fatal: false,
            relatesTo: id
          });
          return;
        }
        (cmd.lines as Usage.UsageLine[]).forEach((line) =>
          this.call.usage.add(line)
        );
        return;
      }
      case "handoff": {
        const target = cmd.app as string;
        const targetApp = this.deps.findApp(target);
        // Handoff stays inside the app's workspace (RV-B3); another workspace's app is reported
        // like an unknown one, so refs of other workspaces are not confirmed.
        if (
          !targetApp ||
          !sameWorkspace(this.app.workspaceRef, targetApp.workspaceRef)
        ) {
          this.emit({
            type: "error",
            code: "bad_message",
            message: `unknown app ${target}`,
            fatal: false,
            relatesTo: id
          });
          return;
        }
        const payload = (cmd.payload as Record<string, unknown>) ?? {};
        const refusal = this.call.handoffRefusal(payload);
        if (refusal) {
          this.emit({
            type: "error",
            code: "bad_message",
            message: refusal,
            fatal: false,
            relatesTo: id
          });
          return;
        }
        this.end("handoff");
        const ok = await this.call.handoff(
          target,
          payload,
          this.app.workspaceRef
        );
        if (!ok) await this.call.hangup("error");
        return;
      }
    }
  }

  // ---- to the app --------------------------------------------------------------------

  private onOutput(e: OutputEvent) {
    if (e.type === "output.started") this.labeler.outputStarted(Date.now());
    if (e.type === "output.done" || e.type === "output.interrupted")
      this.labeler.outputStopped(Date.now());
    this.emit(e as unknown as Record<string, unknown>);
  }

  /** Reports the first use of a catalog id in this session (LO-B11). */
  private noteCatalogUse(
    id: string,
    r: { id?: string; event?: CatalogUse["event"]; replacement?: string }
  ) {
    if (this.usedIds.has(id) || !this.deps.onCatalogUse) return;
    this.usedIds.add(id);
    try {
      this.deps.onCatalogUse({
        workspaceRef: this.app.workspaceRef ?? null,
        appRef: this.app.ref,
        sessionRef: this.sessionRef,
        callRef: this.call.callRef,
        id,
        resolvedId: r.id ?? id,
        ...(r.event ? { event: r.event, replacement: r.replacement } : {}),
        at: new Date().toISOString()
      });
    } catch {
      // Reporting never affects the call.
    }
  }

  emit(message: Record<string, unknown>) {
    if (this.closed) return;
    // Provider failures go in the call record as events too (add-provider-registry 3.4), even
    // when the app does not take the speech layer.
    if (message.type === "error" && /^provider_/.test(String(message.code)))
      this.call.record("event", {
        type: "provider.error",
        code: message.code,
        relatesTo: message.relatesTo ?? null,
        message: message.message,
        sessionRef: this.sessionRef,
        appRef: this.app.ref
      });
    if (
      !this.codec.speechLayer &&
      !["mark", "dtmf", "amd.result"].includes(message.type as string)
    )
      return;
    this.codec.event(message);
    // Listeners get the same events as the controlling app (the fonoster view, whatever the protocol).
    if (message.type !== "turn.estimate")
      for (const l of this.listeners) l.json(message);
    if (message.type !== "turn.estimate")
      this.call.record("appbridge", message);
  }
}

/** App default hints plus session hints: trimmed, deduplicated (case-insensitive), at most 100. */
export function mergeHints(...lists: (string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of lists.flat()) {
    const t = typeof h === "string" ? h.trim() : "";
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out.slice(0, 100);
}
