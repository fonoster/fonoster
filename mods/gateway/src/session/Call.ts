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
  SESSION_PROTOCOL,
  SessionEndReason,
  SessionStart,
  SUBSCRIBABLE_EVENTS,
  Webhooks
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import Ajv, { ValidateFunction } from "ajv";
import WebSocket from "ws";
import { AppConfig, DEFAULTS, GatewayConfig, recordingPolicy } from "../config";
import {
  AudioFilterChain,
  AudioFilterFactory,
  bufferToInt16,
  int16ToBuffer
} from "../filters";
import { NativeCodec } from "../flavors/native";
import { TwilioCodec } from "../flavors/twilio";
import { FlavorCodec } from "../flavors/types";
import {
  MediaCommandError,
  MediaControl,
  MediaEvent
} from "../media/MediaControl";
import { RtpLink } from "../media/RtpLink";
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

const logger = getLogger({ service: "gateway", filePath: __filename });

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

/** Commands an app may send while the caller is on hold (gateway B24). */
const ALLOWED_ON_HOLD = new Set([
  "resume",
  "hangup",
  "transfer",
  "handoff",
  "record.note"
]);

/** media-control ending reasons → session.end reasons (voice-session, "Session ending"). */
export function sessionEndReason(reason: unknown): SessionEndReason {
  switch (reason) {
    case "max_duration":
      return "timeout";
    case "media_timeout":
    case "node_error":
      return "error";
    default:
      return "caller_hangup";
  }
}

/** The call record's end reason: the session reason, except that the callee hanging up stays so. */
export function recordEndReason(reason: unknown): string {
  return reason === "callee_hangup" ? reason : sessionEndReason(reason);
}

export type CallInfo = {
  nodeId: string;
  roomRef: string;
  callRef: string;
  callerRef: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  metadata: Record<string, unknown>;
  /** The caller's tracks from call.incoming (the recording listener needs their ids). */
  callerTracks?: unknown[];
  /** The media node's trace context from call.incoming: the call's span joins its trace. */
  traceparent?: string;
};

export type CallDeps = {
  config: GatewayConfig;
  media: MediaControl;
  catalog: Catalog;
  record: CallRecordSink;
  findApp: (ref: string) => AppConfig | undefined;
  webhooks?: (event: Webhooks.WebhookEvent) => void;
  /** Once per session and catalog id it resolved (registry usage and runtime warnings, LO-B11). */
  onCatalogUse?: (use: CatalogUse) => void;
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
 * One call owned by this gateway: the room on the media node, the RTP link and, at any time, at
 * most one app session (handoff replaces it). Speech, turn-taking and the output queue live
 * here, never in the media node.
 */

/** Both apps belong to the same, known workspace (handoff never crosses workspaces, RV-B3). */
function sameWorkspace(a?: string, b?: string): boolean {
  return a !== undefined && b !== undefined && a === b;
}

export class Call {
  readonly startedAt = Date.now();
  private rtp = new RtpLink();
  private sessionParticipantRef?: string;
  private unsubscribeRoom?: () => void;
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

  private readonly span: ReturnType<typeof telemetry.startCall>;

  constructor(
    readonly info: CallInfo,
    private readonly deps: CallDeps
  ) {
    this.span = telemetry.startCall(
      info.callRef,
      "gateway.call",
      undefined,
      info.traceparent
    );
    telemetry.count("fonoster.gateway.calls.total");
    telemetry.log("info", "call started", { callRef: info.callRef });
    this.recording = new CallRecording(
      this,
      deps.record.recordingDir?.(info.callRef),
      deps.config.rtp
    );
    this.recording.noteTracks(info.callerRef, info.callerTracks);
  }

  get callRef() {
    return this.info.callRef;
  }

  /** The workspace of the app currently running the call, when the app config names it. */
  get workspaceRef(): string | undefined {
    return this.session?.workspaceRef;
  }

  nextCommandId(): string {
    return `gw-${this.info.callRef}-${++this.seq}`;
  }

  record(
    source: "app" | "gateway" | "event",
    message: Record<string, unknown>
  ) {
    this.deps.record.append(this.info.callRef, {
      at: Date.now(),
      source,
      message
    });
  }

  /** Runs an inbound or answered outbound call with its app. */
  async run(app: AppConfig) {
    this.routedTo = app;
    this.unsubscribeRoom = this.deps.media.subscribeRoom(
      this.info.nodeId,
      this.info.roomRef,
      (e) => this.onMediaEvent(e)
    );
    this.record("event", {
      type: "call.started",
      direction: this.info.direction,
      appRef: app.ref,
      workspaceRef: app.workspaceRef ?? null,
      from: this.info.from,
      to: this.info.to
    });
    // The workspace's own vendor keys, looked up once per session (registry 3.2).
    await this.deps.catalog.prepare(app.workspaceRef);

    const reached = await this.dial(app);
    const socket = reached?.socket;
    if (this.ended) return socket?.terminate();

    try {
      await this.joinRoom();
      const policy = recordingPolicy(this.deps.config, reached?.app ?? app);
      if (reached && policy === "consent") {
        // The caller hears the consent prompt before recording starts and before the app's
        // session begins (call-record "Consent prompt").
        if (this.info.direction === "inbound")
          await this.mediaCommand({ type: "answer" });
        await this.consentPrompt(reached.app);
        if (this.ended) return socket?.terminate();
        await this.startRecording(policy);
        this.attach(reached.app, reached.socket, null);
      } else {
        if (reached) void this.startRecording(policy);
        // Auto-answer once the app's socket is open and session.start is sent (VS12).
        if (reached) this.attach(reached.app, reached.socket, null);
        if (this.info.direction === "inbound")
          await this.mediaCommand({ type: "answer" });
      }
    } catch (e) {
      logger.error(
        `call ${this.callRef}: could not set up media: ${(e as Error).message}`
      );
      socket?.terminate();
      return this.finish("error");
    }

    if (!socket) {
      this.failed("app_unreachable");
      await this.fallbackMessage(app);
    }
  }

  private async startRecording(policy: ReturnType<typeof recordingPolicy>) {
    if (policy === "off" || !this.sessionParticipantRef) return;
    await this.recording.start(
      policy,
      this.info.callerRef,
      this.sessionParticipantRef
    );
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

  /** The call never reached an app: a minimal record and `call.failed` (gateway B26). */
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

  /** Refuses an unroutable call (claimed, then hung up with a SIP status). */
  async reject(sipStatus: number) {
    this.hangingUp = "error";
    try {
      await this.mediaCommand({ type: "hangup", sipStatus });
    } catch {
      // the room may already be gone
    }
    this.finish("error");
  }

  /** The media node stopped sending heartbeats: its calls are gone (media-control, liveness). */
  nodeLost() {
    if (this.ended) return;
    this.record("event", { type: "call.failure", reason: "node_error" });
    if (!this.answeredBy) this.failed("node_error");
    this.finish("error");
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

  private async joinRoom() {
    if (this.deps.config.rtp?.srtp) this.rtp.enableSrtp();
    const offer = await this.rtp.bind(
      this.deps.config.rtp?.host ?? "127.0.0.1",
      this.deps.config.rtp?.advertiseHost
    );
    const ack = await this.mediaCommand({
      type: "participant.add",
      kind: "session",
      rtp: offer
    });
    const rtp = ack.rtp as {
      host: string;
      port: number;
      srtp?: { suite: string; key: string };
    };
    this.sessionParticipantRef = ack.participantRef as string;
    this.rtp.connect(rtp);
    this.rtp.on("frame", (frame: Buffer) => this.session?.callerAudio(frame));
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
      adapter: voice.adapter
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
      this.deps.webhooks?.(
        Webhooks.callStarted(app.workspaceRef ?? "default", this.parties(app))
      );
    }
    this.session = new AppSession(this, app, socket, handoff, this.deps, (f) =>
      this.rtp.send(f)
    );
    this.session.start();
  }

  async mediaCommand(
    command: { type: string; [k: string]: unknown },
    id = this.nextCommandId()
  ) {
    return this.deps.media.command(
      this.info.nodeId,
      { ...command, id, roomRef: this.info.roomRef },
      telemetry.traceparent(this.info.callRef)
    );
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

  /** Hangs up the room and ends the session with a reason. */
  async hangup(reason: SessionEndReason) {
    if (this.ended || this.hangingUp) return;
    // Room events caused by our own hangup can arrive before its ack; they end with this reason.
    this.hangingUp = reason;
    try {
      await this.mediaCommand({ type: "hangup" });
    } catch (e) {
      logger.warn(
        `call ${this.callRef}: hangup failed: ${(e as Error).message}`
      );
    }
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
    this.unsubscribeRoom?.();
    // The recording is flushed before the record is closed, so sealing finds all of it.
    this.recording.stop();
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

  sessionDetached(session: AppSession) {
    if (this.session === session) this.session = undefined;
  }

  private onMediaEvent(event: MediaEvent) {
    this.record("event", { media: event });
    switch (event.type) {
      case "participant.joined":
        this.recording.noteTracks(event.participantRef, event.tracks);
        break;
      case "dtmf":
        this.session?.callerDtmf(String(event.digit));
        break;
      case "participant.left":
        if (event.participantRef === this.info.callerRef)
          this.finish(
            this.hangingUp ?? sessionEndReason(event.reason),
            this.hangingUp ?? recordEndReason(event.reason)
          );
        else if (event.participantRef === this.sessionParticipantRef)
          this.session?.leftRoom();
        break;
      case "room.ended":
        if (!this.answeredBy && event.reason && event.reason !== "removed")
          this.failed(String(event.reason), event.sipStatus as number);
        {
          const reason =
            this.hangingUp ??
            (this.session?.pendingTransferEnd
              ? "transfer"
              : sessionEndReason(event.reason));
          this.finish(
            reason,
            reason === sessionEndReason(event.reason) && !this.hangingUp
              ? recordEndReason(event.reason)
              : reason
          );
        }
        break;
      case "transfer.result":
        this.session?.transferResult(event);
        break;
    }
  }
}

type PendingTransfer = { id: string; mode: string };

/** One app's session on a call (until hangup, transfer or handoff). */
export class AppSession {
  readonly sessionRef = randomUUID();

  get workspaceRef() {
    return this.app.workspaceRef;
  }
  private codec: FlavorCodec;
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
      app.flavor === "twilio"
        ? new TwilioCodec(
            send,
            app.workspaceRef ??
              deps.config.http?.accountSid ??
              "AC00000000000000000000000000000000"
          )
        : new NativeCodec(send, app.audio ?? { codec: "pcm16", rate: 16000 });
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
    const audio = this.app.audio ?? { codec: "pcm16" as const, rate: 16000 };
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
    this.call.record("gateway", start as unknown as Record<string, unknown>);
    for (const f of early) this.onFrame(f.data as Buffer, f.isBinary);
    void this.attachListeners(start);
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
    for (const frame of this.recentCaller) this.stt?.write(frame);
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

  private async attachListeners(start: SessionStart) {
    const audio = this.app.audio ?? { codec: "pcm16", rate: 16000 };
    for (const config of (this.app.listeners ?? []).slice(0, 4)) {
      try {
        const socket = await Listener.connect(
          config.url,
          this.app.signingSecret
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
   * Builds the app's filter chain. A filter that cannot be created or started degrades to
   * unfiltered audio and is recorded (voice-session, "Audio filters come from app configuration").
   */
  private async startFilters() {
    const configs = this.app.filters ?? [];
    if (!configs.length) return;
    try {
      const chain = AudioFilterFactory.createChainFromConfig(configs);
      await chain.ready();
      const failed = chain.getStats().filters.filter((f) => f.disabled);
      for (const f of failed) {
        this.call.record("event", {
          type: "filter.failed",
          name: f.name,
          reason: f.error
        });
      }
      if (this.closed) return chain.close();
      this.filters = chain;
    } catch (e) {
      this.call.record("event", {
        type: "filter.failed",
        reason: (e as Error).message
      });
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
        // The app owns interruption (B22): the gateway only reports turn.user_started.
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
      .then((out) => this.hear(int16ToBuffer(out), at))
      .catch(() => this.hear(frame, at));
  }

  private closeFilters() {
    const chain = this.filters;
    this.filters = undefined;
    if (chain) void chain.drain().finally(() => chain.close());
  }

  /** Caller audio after filtering: what speech recognition and turn detection get. */
  private hear(frame: Buffer, at: number) {
    if (this.closed) return;
    this.stt?.write(frame);
    this.pacing?.onAudio(frame, at);
  }

  callerDtmf(digit: string) {
    this.emit({ type: "dtmf", digit });
  }

  /** The node removed our session participant (cold transfer completed). */
  leftRoom() {
    if (this.transfer) this.endWith("transfer");
  }

  transferResult(event: MediaEvent) {
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
      this.call.record("gateway", end);
      this.socket.close(1000);
    }
    this.call.sessionDetached(this);
  }

  private endWith(reason: SessionEndReason) {
    this.end(reason);
    if (reason === "transfer")
      this.call.record("event", { type: "session.transferred" });
  }

  // ---- from the app ------------------------------------------------------------------

  private onSocketClosed() {
    if (this.closed) return;
    // The app dropped mid-call: hang up (VS11).
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
    void this.call.hangup("app_hangup");
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
      const detail = e instanceof MediaCommandError ? ` (${e.code})` : "";
      this.emit({
        type: "error",
        code: "internal",
        message: `${type} failed${detail}: ${(e as Error).message}`,
        fatal: false,
        relatesTo
      });
    }
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
          this.emit({
            type: "error",
            code: "invalid_catalog_id",
            message: `voice ${voiceId} is not in the catalog`,
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
          adapter: voice.adapter
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
        await this.call.mediaCommand(
          { type: "dtmf.send", digits: cmd.digits },
          id
        );
        return;
      case "hold":
        await this.call.mediaCommand(
          {
            type: "hold",
            participantRef: this.call.callerParticipantRef,
            music: cmd.music
          },
          id
        );
        this.call.onHold = true;
        return;
      case "resume":
        await this.call.mediaCommand(
          { type: "resume", participantRef: this.call.callerParticipantRef },
          id
        );
        this.call.onHold = false;
        return;
      case "transfer": {
        const transferId = id ?? this.call.nextCommandId();
        const mode = (cmd.mode as string) ?? "cold";
        this.transfer = { id: transferId, mode };
        try {
          await this.call.mediaCommand(
            {
              type: "transfer",
              to: cmd.to,
              mode,
              headers: cmd.headers,
              music: cmd.music
            },
            transferId
          );
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
        await this.call.mediaCommand({ type: "transfer.complete" }, id);
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
      !["mark", "dtmf"].includes(message.type as string)
    )
      return;
    this.codec.event(message);
    // Listeners get the same events as the controlling app (the native view, whatever the flavor).
    if (message.type !== "turn.estimate")
      for (const l of this.listeners) l.json(message);
    if (message.type !== "turn.estimate") this.call.record("gateway", message);
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
