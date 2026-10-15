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
  SUBSCRIBABLE_EVENTS
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import Ajv, { ValidateFunction } from "ajv";
import WebSocket from "ws";
import { AppConfig, DEFAULTS, GatewayConfig } from "../config";
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
import { CallRecordSink } from "../record/CallRecordSink";
import { Catalog } from "../speech/Catalog";
import { SpeechError, SttStream } from "../speech/types";
import { BaselineDetector } from "../turn/Detector";
import { Pacing } from "../turn/Pacing";
import { connectApp } from "./connectApp";
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

/** How often turn.estimate is sent to subscribers. */
const ESTIMATE_EVERY_MS = 100;

export type CallInfo = {
  nodeId: string;
  roomRef: string;
  callRef: string;
  callerRef: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  metadata: Record<string, unknown>;
};

export type CallDeps = {
  config: GatewayConfig;
  media: MediaControl;
  catalog: Catalog;
  record: CallRecordSink;
  findApp: (ref: string) => AppConfig | undefined;
  onEnded: (call: Call) => void;
};

/**
 * One call owned by this gateway: the room on the media node, the RTP link and, at any time, at
 * most one app session (handoff replaces it). Speech, turn-taking and the output queue live
 * here, never in the media node.
 */
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

  constructor(
    readonly info: CallInfo,
    private readonly deps: CallDeps
  ) {}

  get callRef() {
    return this.info.callRef;
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
    this.unsubscribeRoom = this.deps.media.subscribeRoom(
      this.info.nodeId,
      this.info.roomRef,
      (e) => this.onMediaEvent(e)
    );
    this.record("event", {
      type: "call.started",
      direction: this.info.direction,
      appRef: app.ref
    });

    const reached = await this.dial(app);
    const socket = reached?.socket;
    if (this.ended) return socket?.terminate();

    try {
      await this.joinRoom();
      // Auto-answer once the app's socket is open and session.start is sent (VS12).
      if (reached) this.attach(reached.app, reached.socket, null);
      if (this.info.direction === "inbound")
        await this.mediaCommand({ type: "answer" });
    } catch (e) {
      logger.error(
        `call ${this.callRef}: could not set up media: ${(e as Error).message}`
      );
      socket?.terminate();
      return this.finish("error");
    }

    if (!socket) await this.fallbackMessage(app);
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
    const offer = await this.rtp.bind(
      this.deps.config.rtp?.host ?? "127.0.0.1",
      this.deps.config.rtp?.advertiseHost
    );
    const ack = await this.mediaCommand({
      type: "participant.add",
      kind: "session",
      rtp: offer
    });
    const rtp = ack.rtp as { host: string; port: number };
    this.sessionParticipantRef = ack.participantRef as string;
    this.rtp.connect(rtp);
    this.rtp.on("frame", (frame: Buffer) => this.session?.callerAudio(frame));
  }

  /** No app could be reached: speak the fallback message, if any, then hang up. */
  private async fallbackMessage(app: AppConfig) {
    const message = app.fallback?.message;
    const voice = message
      ? this.deps.catalog.resolveVoice(app.speech.voice)
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
    this.session = new AppSession(this, app, socket, handoff, this.deps, (f) =>
      this.rtp.send(f)
    );
    this.session.start();
  }

  async mediaCommand(
    command: { type: string; [k: string]: unknown },
    id = this.nextCommandId()
  ) {
    return this.deps.media.command(this.info.nodeId, {
      ...command,
      id,
      roomRef: this.info.roomRef
    });
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

  async handoff(appRef: string, payload: Record<string, unknown>) {
    const target = this.deps.findApp(appRef);
    if (!target) return false;
    this.handoffs++;
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

  /** Ends everything locally: session, speech, RTP, subscriptions. */
  finish(reason: SessionEndReason) {
    if (this.ended) return;
    this.ended = true;
    this.session?.end(reason);
    this.session = undefined;
    this.rtp.close();
    this.unsubscribeRoom?.();
    this.record("event", { type: "call.ended", reason });
    this.deps.record.close(this.info.callRef);
    this.deps.onEnded(this);
  }

  sessionDetached(session: AppSession) {
    if (this.session === session) this.session = undefined;
  }

  private onMediaEvent(event: MediaEvent) {
    this.record("event", { media: event });
    switch (event.type) {
      case "dtmf":
        this.session?.callerDtmf(String(event.digit));
        break;
      case "participant.left":
        if (event.participantRef === this.info.callerRef)
          this.finish(this.hangingUp ?? "caller_hangup");
        else if (event.participantRef === this.sessionParticipantRef)
          this.session?.leftRoom();
        break;
      case "room.ended":
        this.finish(
          this.hangingUp ??
            (this.session?.pendingTransferEnd ? "transfer" : "caller_hangup")
        );
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
  private codec: FlavorCodec;
  private queue: OutputQueue;
  private stt?: SttStream;
  private pacing?: Pacing;
  private subscriptions = new Set<string>();
  private lastEstimateAt = 0;
  private closed = false;
  private transfer?: PendingTransfer;
  private listeners: Listener[] = [];
  private keepalive?: ReturnType<typeof setInterval>;
  private filters?: AudioFilterChain;
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
            deps.config.http?.accountSid ?? "AC00000000000000000000000000000000"
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
    this.socket.on("close", () => this.onSocketClosed());
    this.socket.on("error", () => undefined);
    this.startKeepalive();

    this.codec.start(start);
    this.call.record("gateway", start as unknown as Record<string, unknown>);
    void this.attachListeners(start);
    this.queue.start();
    if (this.codec.speechLayer) {
      void this.startFilters();
      this.startSpeech();
    }
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
    this.pacing = new Pacing(
      new BaselineDetector({
        silenceTimeoutMs:
          this.app.speech.silenceTimeoutMs ?? DEFAULTS.silenceTimeoutMs
      }),
      {
        turn: (e) => this.emit(e),
        partial: (text, lang) => {
          if (this.subscriptions.has("transcript.partial"))
            this.emit({ type: "transcript.partial", text, language: lang });
        },
        estimate: (e) => {
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
        interruption: () => this.queue.interrupt()
      },
      { language }
    );
    this.queue.onPlaying((playing) => this.pacing?.onOutput(playing));

    const adapter = this.deps.catalog.defaultStt();
    if (!adapter) return;
    this.stt = adapter.open({ language });
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
    if (this.closed) return;
    this.codec.callerAudio(frame);
    for (const l of this.listeners) l.callerAudio(frame);
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
    this.closeFilters();
    this.queue.stop();
    this.stt?.close();
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
    this.closeFilters();
    this.queue.stop();
    this.stt?.close();
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
        const voice = this.deps.catalog.resolveVoice(voiceId);
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
        this.queue.clear();
        return;
      case "subscribe":
        for (const e of cmd.events as string[]) {
          if ((SUBSCRIBABLE_EVENTS as readonly string[]).includes(e))
            this.subscriptions.add(e);
        }
        return;
      case "listen.update":
        if (cmd.language) this.pacing?.setLanguage(cmd.language as string);
        this.stt?.update({
          language: cmd.language as string,
          hints: cmd.hints as string[]
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
        return;
      case "resume":
        await this.call.mediaCommand(
          { type: "resume", participantRef: this.call.callerParticipantRef },
          id
        );
        return;
      case "transfer": {
        const transferId = id ?? this.call.nextCommandId();
        const mode = (cmd.mode as string) ?? "cold";
        this.transfer = { id: transferId, mode };
        try {
          await this.call.mediaCommand(
            { type: "transfer", to: cmd.to, mode, headers: cmd.headers },
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
        await this.call.mediaCommand({
          type: "participant.remove",
          participantRef: this.call.sessionParticipant
        });
        this.endWith("transfer");
        return;
      case "handoff": {
        const target = cmd.app as string;
        if (!this.deps.findApp(target)) {
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
        const ok = await this.call.handoff(target, payload);
        if (!ok) await this.call.hangup("error");
        return;
      }
    }
  }

  // ---- to the app --------------------------------------------------------------------

  private onOutput(e: OutputEvent) {
    this.emit(e as unknown as Record<string, unknown>);
  }

  emit(message: Record<string, unknown>) {
    if (this.closed) return;
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
