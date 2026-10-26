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
import { CALL_REF_ATTR, Usage } from "@fonoster/common";
import { isProviderAuthError, ProviderAuthError } from "@fonoster/community";
import { getLogger } from "@fonoster/logger";
import { SessionEndedError, SessionError } from "@fonoster/voice";
import { AsyncQueue } from "./AsyncQueue";
import { SessionAgent } from "./config";
import { KNOWLEDGE_TIMEOUT_MS, KnowledgePort } from "./knowledge";
import { sentences } from "./sentences";
import { telemetry } from "./telemetry";
import { ChatMessage, Think, ThinkChunk, ToolCall, ToolSpec } from "./think";
import { ToolPort } from "./tools";
import type { Session } from "@fonoster/voice";

/** What Autopilot says when a transfer fails and the agent sets no `failedMessage`. */
export const DEFAULT_TRANSFER_FAILED_MESSAGE =
  "Sorry, I couldn't connect you. How else can I help?";

const logger = getLogger({ service: "autopilot", filePath: __filename });

const MAX_TOOL_ROUNDS = 4;
const BUILT_IN_TOOLS: ToolSpec[] = [
  {
    name: "hangup",
    description: "End the call when the conversation is over.",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "transfer",
    description: "Transfer the caller to an operator (a person).",
    parameters: { type: "object", properties: {} }
  }
];

export type SpokenSource = "greeting" | "reply" | "idle" | "error";

export type AgentEvent =
  | { type: "TURN_USER_STARTED" }
  | { type: "TURN_LIKELY_ENDED"; text: string }
  | { type: "TURN_RESUMED" }
  | { type: "TURN_ENDED"; text: string }
  | { type: "TURN_BACKCHANNEL" }
  | { type: "REPLY_SPEAKING" }
  /** An output finished; `source` says which, so stale events from an earlier phase are ignored. */
  | { type: "SPOKEN"; source: SpokenSource }
  | { type: "IDLE" }
  | { type: "MAX_DURATION" }
  | { type: "HANGUP_REQUESTED" }
  | { type: "TRANSFER_REQUESTED" }
  | { type: "SESSION_END" };

/** One turn's trace for the call record (rework-autopilot A10). */
export type TurnTrace = {
  userText: string;
  replyText: string;
  heardText: string;
  interrupted: boolean;
  toolCalls: { name: string; ok: boolean }[];
  /** ms from turn.ended to the first token, and to the first speak sent. */
  firstTokenMs?: number;
  firstSpeakMs?: number;
};

export interface Recorder {
  turn(trace: TurnTrace): void;
  note(event: Record<string, unknown>): void;
  /** Model token usage for the call (usage.report); absent where there is no call. */
  usage?(lines: Usage.UsageLine[]): void;
}

/** Writes turn traces and notes to the call record through the session (record.note). */
export function sessionRecorder(session: Session): Recorder {
  const write = (data: Record<string, unknown>) =>
    void session.note(data).catch(() => undefined);
  return {
    turn: (trace) => write({ kind: "autopilot.turn", ...trace }),
    note: (event) => write({ kind: "autopilot.note", ...event }),
    usage: (lines) => void session.reportUsage(lines).catch(() => undefined)
  };
}

export const logRecorder: Recorder = {
  turn: (trace) => logger.verbose("autopilot turn", trace),
  note: (event) => logger.verbose("autopilot note", event)
};

type Prepared = {
  text: string;
  abort: AbortController;
  chunks: AsyncQueue<ThinkChunk>;
  /** Knowledge found for the prepared text, reused by every round of the reply. */
  context: ChatMessage[];
};

/** The side effects of Autopilot: everything the state machine asks it to do on the session. */
export class Agent {
  readonly history: ChatMessage[] = [];
  private reply?: AbortController;
  private inflight?: Promise<void>;
  private prepared?: Prepared;
  private idleTimer?: ReturnType<typeof setTimeout>;
  /** The model's `transfer` tool call, answered in the history if the transfer fails. */
  private transferCallId?: string;
  private maxTimer?: ReturnType<typeof setTimeout>;
  private idleCount = 0;
  private resumes = 0;
  /** Whether a reply is prepared on turn.likely_ended (off at high patience or once adapted). */
  private prepareEarly: boolean;
  private stopped = false;
  /** A vendor rejected the model's key and the call is failing (#1146). */
  private keyFailed = false;
  send: (event: AgentEvent) => void = () => undefined;

  constructor(
    private readonly session: Session,
    private readonly agent: SessionAgent,
    private readonly think: Think,
    private readonly tools: ToolPort,
    private readonly recorder: Recorder = logRecorder,
    private readonly knowledge?: KnowledgePort
  ) {
    this.prepareEarly = agent.conversationSettings.patience !== "high";
  }

  get settings() {
    return this.agent.conversationSettings;
  }

  // ---- lifecycle ----------------------------------------------------------------------

  /** Greeting: subscribe to the estimate, send initial DTMF, speak the first message. */
  async greet() {
    this.maxTimer = setTimeout(
      () => this.send({ type: "MAX_DURATION" }),
      this.settings.maxSessionDuration
    );
    await this.safely(async () => {
      await this.session.subscribe(["turn.estimate"]);
      // AppBridge's Pacing policy owns turn timing; Autopilot only tells it how patient to be.
      // Recognition hints (names, brands) add to the app's defaults at AppBridge (VO-B3).
      const hints = this.settings.hints?.length
        ? this.settings.hints
        : undefined;
      if (this.settings.patience !== "normal" || hints)
        await this.session.listen({
          ...(this.settings.patience !== "normal"
            ? { patience: this.settings.patience }
            : {}),
          ...(hints ? { hints } : {})
        });
      if (this.settings.initialDtmf)
        await this.session.playDtmf(this.settings.initialDtmf);
      if (this.settings.firstMessage) {
        const r = await this.session.say(
          this.settings.firstMessage,
          this.speechOptions()
        );
        this.history.push({ role: "assistant", content: r.heardText });
      }
      this.send({ type: "SPOKEN", source: "greeting" });
    });
  }

  stop() {
    this.stopped = true;
    this.endTurns();
  }

  /** Nothing more is said or prepared: the reply, the prepared reply and the timers stop. */
  private endTurns() {
    this.abortReply();
    this.discardPrepared();
    clearTimeout(this.idleTimer);
    clearTimeout(this.maxTimer);
  }

  // ---- idle -------------------------------------------------------------------------

  armIdle() {
    clearTimeout(this.idleTimer);
    const idle = this.settings.idleOptions;
    if (idle)
      this.idleTimer = setTimeout(
        () => this.send({ type: "IDLE" }),
        idle.timeout
      );
  }

  disarmIdle() {
    clearTimeout(this.idleTimer);
  }

  /** The next idle timeout ends the call (the goodbye counts as the last announcement). */
  idleExhausted(): boolean {
    const max = this.settings.idleOptions?.maxTimeoutCount ?? 2;
    return this.idleCount + 1 >= max;
  }

  async sayIdle() {
    this.idleCount++;
    await this.safely(async () => {
      await this.session.say(
        this.settings.idleOptions!.message,
        this.speechOptions()
      );
      this.send({ type: "SPOKEN", source: "idle" });
    });
  }

  // ---- pacing -----------------------------------------------------------------------

  /** turn.likely_ended: start generating silently (when preparing early). */
  prepare(text: string) {
    if (!this.prepareEarly || !text.trim()) return;
    this.discardPrepared();
    const abort = new AbortController();
    const chunks = new AsyncQueue<ThinkChunk>();
    const prepared: Prepared = { text, abort, chunks, context: [] };
    this.prepared = prepared;
    void (async () => {
      prepared.context = await this.contextFor(text, abort.signal);
      if (abort.signal.aborted) return chunks.end();
      const messages = [
        ...this.messages(prepared.context),
        { role: "user" as const, content: text }
      ];
      await this.pump(this.traced(messages, abort.signal), chunks);
    })();
  }

  /** turn.resumed: the caller kept talking; the prepared reply is dropped. */
  resumed() {
    this.discardPrepared();
    this.resumes++;
    if (this.resumes >= 3 && this.prepareEarly) {
      // A caller who pauses often: stop preparing early for the rest of this call. AppBridge
      // adapts its own turn timing within the call (TT-B6), so Autopilot does not also change
      // the patience it asked for (AP-B2).
      this.prepareEarly = false;
      this.recorder.note({
        type: "pacing.adapted",
        prepare: "on turn.ended",
        resumes: this.resumes
      });
    }
  }

  // ---- replies ----------------------------------------------------------------------

  async clear() {
    await this.safely(() => this.session.stopSay());
  }

  abortReply() {
    this.reply?.abort();
    this.reply = undefined;
  }

  /** turn.ended: answer the caller, streaming sentences into one speak id. */
  answer(text: string): Promise<void> {
    const previous = this.inflight;
    this.abortReply();
    const abort = new AbortController();
    this.reply = abort;
    const run = this.respond(text, abort, previous);
    this.inflight = run;
    return run;
  }

  /** One turn (STT final, LLM, TTS) as an autopilot.turn span. */
  private async respond(
    text: string,
    abort: AbortController,
    previous?: Promise<void>
  ) {
    const callRef = this.session.callRef;
    const span = telemetry.startSpan(
      "autopilot.turn",
      { [CALL_REF_ATTR]: callRef },
      telemetry.traceparent(callRef)
    );
    try {
      await this.respondTurn(text, abort, previous);
      span.end({ "turn.cancelled": abort.signal.aborted });
    } catch (e) {
      span.end({}, (e as Error).message);
      throw e;
    } finally {
      telemetry.count("fonoster.autopilot.turns", 1);
    }
  }

  private async respondTurn(
    text: string,
    abort: AbortController,
    previous?: Promise<void>
  ) {
    // Let a cancelled reply settle first, so what the caller heard of it is recorded before
    // this turn (honest history, A6).
    await previous?.catch(() => undefined);
    this.idleCount = 0;
    const turnEnded = Date.now();
    this.history.push({ role: "user", content: text });
    if (abort.signal.aborted) return;

    const trace: TurnTrace = {
      userText: text,
      replyText: "",
      heardText: "",
      interrupted: false,
      toolCalls: []
    };
    let preempt = false;
    if (this.settings.filler) {
      preempt = true;
      void this.session
        .play(this.settings.filler.url, { interruptible: true })
        .catch(() => undefined);
    }

    try {
      const prepared = this.takePrepared(text);
      const context = prepared
        ? prepared.context
        : await this.contextFor(text, abort.signal);
      let source = prepared?.chunks ?? this.startStream(abort.signal, context);
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const outcome = await this.speakRound(
          source,
          abort,
          preempt,
          turnEnded,
          trace
        );
        preempt = false;
        if (
          abort.signal.aborted &&
          !outcome.interrupted &&
          !outcome.completed
        ) {
          // Cancelled by a new turn: only what the caller already heard is kept.
          if (outcome.heard)
            this.history.push({ role: "assistant", content: outcome.heard });
          return;
        }
        this.history.push({
          role: "assistant",
          content: outcome.heard,
          ...(outcome.toolCalls.length ? { tool_calls: outcome.toolCalls } : {})
        });
        if (
          outcome.interrupted ||
          !outcome.toolCalls.length ||
          abort.signal.aborted
        )
          break;

        const builtIn = outcome.toolCalls.find(
          (c) => c.name === "hangup" || c.name === "transfer"
        );
        if (builtIn) {
          if (builtIn.name === "transfer") this.transferCallId = builtIn.id;
          this.recorder.turn({
            ...trace,
            toolCalls: [...trace.toolCalls, { name: builtIn.name, ok: true }]
          });
          this.send({
            type:
              builtIn.name === "hangup"
                ? "HANGUP_REQUESTED"
                : "TRANSFER_REQUESTED"
          });
          return;
        }
        await this.runTools(outcome.toolCalls, abort, trace);
        if (abort.signal.aborted) return;
        source = this.startStream(abort.signal, context);
      }
      this.recorder.turn(trace);
      if (this.reply === abort) this.send({ type: "SPOKEN", source: "reply" });
    } catch (e) {
      if (
        abort.signal.aborted ||
        e instanceof SessionEndedError ||
        this.stopped
      )
        return;
      if (isProviderAuthError(e)) return this.keyRejected(e);
      logger.error(`autopilot reply failed: ${(e as Error).message}`);
      await this.safely(async () => {
        await this.session.say(
          this.settings.systemErrorMessage,
          this.speechOptions()
        );
        this.send({ type: "SPOKEN", source: "error" });
      });
    }
  }

  private async speakRound(
    source: AsyncQueue<ThinkChunk>,
    abort: AbortController,
    preempt: boolean,
    turnEnded: number,
    trace: TurnTrace
  ) {
    const text = new AsyncQueue<string>();
    let toolCalls: ToolCall[] = [];
    let full = "";
    const pump = (async () => {
      try {
        for await (const chunk of source) {
          if (abort.signal.aborted) break;
          if (chunk.type === "text") {
            if (trace.firstTokenMs === undefined)
              trace.firstTokenMs = Date.now() - turnEnded;
            full += chunk.text;
            text.push(chunk.text);
          } else if (chunk.type === "tool_calls") toolCalls = chunk.calls;
        }
        text.end();
      } catch (e) {
        text.fail(e as Error);
      }
    })();

    const iterator = sentences(text)[Symbol.asyncIterator]();
    const first = await iterator.next();
    let heard = "";
    let interrupted = false;
    let completed = false;
    if (!first.done && !abort.signal.aborted) {
      this.send({ type: "REPLY_SPEAKING" });
      trace.firstSpeakMs = Date.now() - turnEnded;
      const pieces = (async function* () {
        yield first.value;
        for (;;) {
          const next = await iterator.next();
          if (next.done) return;
          yield next.value;
        }
      })();
      const result = await this.session.say(pieces, {
        ...this.speechOptions(),
        preempt: preempt || undefined
      });
      heard = result.heardText;
      interrupted = result.interrupted;
      completed = !interrupted;
      if (interrupted) abort.abort();
    }
    await pump;
    trace.replyText += full;
    trace.heardText += heard;
    trace.interrupted ||= interrupted;
    return { heard, interrupted, completed, toolCalls };
  }

  private async runTools(
    calls: ToolCall[],
    abort: AbortController,
    trace: TurnTrace
  ) {
    for (const call of calls) {
      const tool = this.agent.languageModel.tools.find(
        (t) => t.name === call.name
      );
      // The start message is spoken while the tool runs; AppBridge queues the reply after it.
      if (tool?.requestStartMessage) {
        void this.session
          .say(tool.requestStartMessage, this.speechOptions())
          .catch(() => undefined);
      }
      let args: Record<string, unknown> = {};
      try {
        args = call.arguments ? JSON.parse(call.arguments) : {};
      } catch {
        args = {};
      }
      const outcome = await this.tools.run(call.name, args, abort.signal);
      trace.toolCalls.push({ name: call.name, ok: outcome.ok });
      this.history.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(
          outcome.ok ? outcome.result : { error: outcome.error }
        )
      });
    }
  }

  // ---- endings ----------------------------------------------------------------------

  /**
   * The model's vendor rejected the key: retrying can't help, so the call fails and hangs up at
   * once, without an error message (#1146).
   */
  private async keyRejected(e: ProviderAuthError) {
    if (this.keyFailed || this.stopped) return;
    this.keyFailed = true;
    logger.error(`autopilot cannot use its language model: ${e.message}`);
    this.endTurns();
    await this.safely(() =>
      this.session.hangup({
        failure: { reason: e.reason, provider: e.provider, kind: e.kind }
      })
    );
  }

  async goodbye() {
    this.abortReply();
    this.discardPrepared();
    clearTimeout(this.idleTimer);
    await this.safely(async () => {
      await this.session.say(this.settings.goodbyeMessage, {
        ...this.speechOptions(),
        interruptible: false
      });
      await this.session.hangup();
    });
  }

  async transfer() {
    this.abortReply();
    clearTimeout(this.idleTimer);
    const options = this.settings.transferOptions;
    await this.safely(async () => {
      if (!options) {
        await this.session.say(
          this.settings.systemErrorMessage,
          this.speechOptions()
        );
        this.send({ type: "SPOKEN", source: "error" });
        return;
      }
      await this.session.say(options.message, {
        ...this.speechOptions(),
        interruptible: false
      });
      try {
        await this.session.transfer(options.phoneNumber);
      } catch (e) {
        if (!(e instanceof SessionError) || e.code !== "transfer_failed")
          throw e;
        await this.transferFailed(options.failedMessage);
      }
    });
  }

  /**
   * The transfer failed: say so and keep helping (autopilot "Transfer fails"). The model learns
   * the outcome as its transfer call's result, and the machine returns to listening.
   */
  private async transferFailed(message?: string) {
    const callId = this.transferCallId;
    this.transferCallId = undefined;
    if (callId)
      this.history.push({
        role: "tool",
        tool_call_id: callId,
        content: JSON.stringify({ error: "the transfer failed" })
      });
    const r = await this.session.say(
      message || DEFAULT_TRANSFER_FAILED_MESSAGE,
      this.speechOptions()
    );
    this.history.push({ role: "assistant", content: r.heardText });
    this.send({ type: "SPOKEN", source: "error" });
  }

  // ---- internals --------------------------------------------------------------------

  private messages(context: ChatMessage[] = []): ChatMessage[] {
    return [
      { role: "system", content: this.settings.systemPrompt },
      ...context,
      ...this.history
    ];
  }

  /** Knowledge for this turn, as a system message for the request only (never in history). */
  private async contextFor(
    question: string,
    signal: AbortSignal
  ): Promise<ChatMessage[]> {
    if (!this.knowledge) return [];
    const timeout = new Promise<string>((resolve) =>
      setTimeout(() => resolve(""), KNOWLEDGE_TIMEOUT_MS)
    );
    try {
      const found = await Promise.race([
        this.knowledge.find(question, signal),
        timeout
      ]);
      return found?.trim()
        ? [
            {
              role: "system",
              content: `Relevant information:\n${found.trim()}`
            }
          ]
        : [];
    } catch {
      return [];
    }
  }

  private toolSpecs(): ToolSpec[] {
    const own = this.agent.languageModel.tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters as Record<string, unknown>
    }));
    const builtIn = BUILT_IN_TOOLS.filter(
      (b) => b.name !== "transfer" || this.settings.transferOptions
    );
    return [...own, ...builtIn];
  }

  private startStream(
    signal: AbortSignal,
    context: ChatMessage[] = []
  ): AsyncQueue<ThinkChunk> {
    const chunks = new AsyncQueue<ThinkChunk>();
    void this.pump(this.traced(this.messages(context), signal), chunks);
    return chunks;
  }

  /** think.stream inside an autopilot.llm.request span, with request and latency metrics. */
  private async *traced(
    messages: ChatMessage[],
    signal: AbortSignal
  ): AsyncGenerator<ThinkChunk> {
    const callRef = this.session.callRef;
    const span = telemetry.startSpan(
      "autopilot.llm.request",
      { [CALL_REF_ATTR]: callRef, "llm.messages": messages.length },
      telemetry.traceparent(callRef)
    );
    const started = Date.now();
    let first: number | undefined;
    let failure: string | undefined;
    try {
      for await (const chunk of this.think.stream(
        messages,
        this.toolSpecs(),
        signal
      )) {
        first ??= Date.now() - started;
        yield chunk;
      }
    } catch (e) {
      failure = (e as Error).message;
      throw e;
    } finally {
      telemetry.count("fonoster.autopilot.llm.requests", 1);
      if (first !== undefined)
        telemetry.count("fonoster.autopilot.llm.latency_ms", first);
      span.end(
        {
          "llm.first_chunk_ms": first ?? -1,
          "llm.cancelled": signal.aborted
        },
        failure
      );
    }
  }

  private takePrepared(text: string): Prepared | undefined {
    const p = this.prepared;
    this.prepared = undefined;
    if (!p) return undefined;
    if (p.text === text && !p.abort.signal.aborted) {
      // The reply prepared on turn.likely_ended is still valid; adopt its abort controller.
      this.reply?.signal.addEventListener("abort", () => p.abort.abort(), {
        once: true
      });
      return p;
    }
    p.abort.abort();
    return undefined;
  }

  private discardPrepared() {
    this.prepared?.abort.abort();
    this.prepared = undefined;
  }

  private async pump(
    stream: AsyncIterable<ThinkChunk>,
    into: AsyncQueue<ThinkChunk>
  ) {
    // The key was rejected and the call is failing: the model is not asked again.
    if (this.keyFailed) return into.end();
    try {
      for await (const chunk of stream) into.push(chunk);
      into.end();
    } catch (e) {
      into.fail(e as Error);
      // Fatal at once, even for a reply prepared early that is never spoken: a reply discarded
      // after its key was rejected must not lead to a second request (#1146).
      if (isProviderAuthError(e)) void this.keyRejected(e);
    }
  }

  private speechOptions() {
    return {
      voice: this.settings.voice,
      language: this.settings.language,
      interruptible: this.settings.allowUserBargeIn
    };
  }

  /** Runs session work; a session that has ended stops everything quietly. */
  private async safely(fn: () => Promise<void>) {
    if (this.stopped) return;
    try {
      await fn();
    } catch (e) {
      if (e instanceof SessionEndedError || this.stopped) return;
      logger.error(`autopilot session error: ${(e as Error).message}`);
    }
  }
}
