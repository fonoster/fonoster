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
import * as fs from "fs";
import * as path from "path";
import {
  AudioFormat,
  durationMs,
  encode,
  FRAME_MS,
  fromPcm16le,
  generate,
  parseFormat,
  frames as splitFrames
} from "../audio/codecs";
import { SCENARIOS_DIR } from "../scenario/loadScenario";
import { getPath, interpolate, match } from "../scenario/match";
import {
  actionOf,
  AudioSource,
  Scenario,
  Step,
  StepAction
} from "../scenario/types";
import { Harness } from "./Harness";
import { Frame, Peer } from "./Peer";

export type RunOptions = {
  /** Opens the connection to the implementation under test, after setup has been applied. */
  connect: () => Promise<Peer> | Peer;
  harness?: Harness;
  /** How long an untimed expect waits (default 5 s). */
  defaultTimeoutMs?: number;
  /** Where `send_audio.kind: file` paths resolve (default scenarios/audio). */
  audioDir?: string;
  /** Leave the peer open after the run (default: close it). */
  keepOpen?: boolean;
};

export type TimingSample = {
  step: number;
  label?: string;
  elapsedMs: number;
  /** elapsedMs minus fake-provider delays, when the step used budget_ms. */
  adjustedMs?: number;
};

export type StepResult = {
  step: number;
  action: StepAction;
  ok: boolean;
  error?: string;
};

export type ScenarioResult = {
  name: string;
  contract: string;
  status: "passed" | "failed" | "skipped";
  reason?: string;
  steps: StepResult[];
  samples: TimingSample[];
  /** Every value measured by an assert step, for reports. */
  measurements: { step: number; name: string; value: unknown }[];
  durationMs: number;
};

class StepFailure extends Error {}

type AudioTally = { at: number; track?: number; ms: number };

/** Executes one scenario against a peer. Never throws for scenario failures. */
export async function runScenario(
  scenario: Scenario,
  options: RunOptions
): Promise<ScenarioResult> {
  const started = Date.now();
  const result: ScenarioResult = {
    name: scenario.name,
    contract: scenario.contract,
    status: "passed",
    steps: [],
    samples: [],
    measurements: [],
    durationMs: 0
  };

  if (scenario.skip) {
    return { ...result, status: "skipped", reason: scenario.skip };
  }

  const run = new Run(scenario, options, result);
  let peer: Peer | undefined;

  try {
    if (scenario.setup) {
      if (!options.harness?.setup)
        throw new StepFailure(
          "scenario has setup but the harness cannot apply it"
        );
      await options.harness.setup(scenario.setup);
    }
    peer = await options.connect();
    await run.execute(peer);
  } catch (e) {
    result.status = "failed";
    result.reason = (e as Error).message;
  } finally {
    if (peer && !options.keepOpen && !peer.frames.closed) peer.close();
  }

  result.durationMs = Date.now() - started;
  return result;
}

class Run {
  private readonly twilio: boolean;
  private readonly ignore: Set<string>;
  private readonly timeout: number;
  private readonly vars: Record<string, unknown>;
  private readonly labels = new Map<string, number>();
  private cursor = 0;
  private audioCursor = 0;
  private audio: AudioTally[] = [];
  private format?: AudioFormat;
  private streamSid?: string;
  private prevEnd = Date.now();
  private peer!: Peer;

  constructor(
    private readonly scenario: Scenario,
    private readonly options: RunOptions,
    private readonly result: ScenarioResult
  ) {
    this.twilio =
      scenario.contract === "twilio-media-streams-flavor" ||
      scenario.setup?.app?.protocol === "twilio";
    this.ignore = new Set(scenario.ignore ?? []);
    this.timeout = options.defaultTimeoutMs ?? 5000;
    this.vars = {
      ...(options.harness?.vars?.() ?? {}),
      scenario: scenario.name
    };
    if (this.twilio) this.format = { codec: "pcmu", rate: 8000 };
  }

  async execute(peer: Peer) {
    this.peer = peer;
    this.prevEnd = Date.now();

    for (const [i, step] of this.scenario.steps.entries()) {
      const action = actionOf(step);
      try {
        await this.runStep(i + 1, step, action);
        this.result.steps.push({ step: i + 1, action, ok: true });
      } catch (e) {
        const error = (e as Error).message;
        this.result.steps.push({ step: i + 1, action, ok: false, error });
        throw new Error(
          `step ${i + 1} (${action}${step.label ? ` "${step.label}"` : ""}): ${error}`
        );
      }
      this.prevEnd = Date.now();
      if (step.label) this.labels.set(step.label, this.prevEnd);
    }
  }

  private async runStep(index: number, step: Step, action: StepAction) {
    switch (action) {
      case "send": {
        const data = interpolate(step.send!, this.vars);
        this.observeOutgoing(data);
        this.peer.sendJson(data);
        return;
      }
      case "send_audio":
        return this.sendAudio(step.send_audio!);
      case "expect":
        return this.expect(index, step);
      case "expect_none":
        return this.expectNone(step);
      case "expect_audio":
        return this.expectAudio(index, step);
      case "expect_close":
        return this.expectClose(index, step);
      case "wait":
        return new Promise<void>((r) => setTimeout(r, step.wait!.ms));
      case "inject":
        if (!this.options.harness?.inject)
          throw new StepFailure("the harness cannot inject provider behaviour");
        return this.options.harness.inject(step.inject!);
      case "assert":
        return this.assert(index, step.assert!, this.anchor(step));
      case "close":
        this.peer.close(step.close!.code, step.close!.reason);
        return;
      case "caller":
        if (!this.options.harness?.caller) {
          throw new StepFailure("the harness cannot act as the caller");
        }
        return this.options.harness.caller(step.caller!);
    }
  }

  // ---- incoming frames -------------------------------------------------------------------

  private typeOf(data: Record<string, unknown>): string | undefined {
    const t = this.twilio ? data.event : data.type;
    return typeof t === "string" ? t : undefined;
  }

  /** Consumes audio frames and tracks state (format, streamSid) as frames arrive. */
  private absorb() {
    const items = this.peer.frames.items;
    for (; this.audioCursor < items.length; this.audioCursor++) {
      const frame = items[this.audioCursor];
      if (frame.kind === "binary") {
        const native = !this.twilio && this.scenario.role === "app";
        const payload = native ? frame.data.length - 1 : frame.data.length;
        const track = native ? frame.data[0] : undefined;
        this.tallyAudio(frame.at, track, payload);
      } else if (frame.kind === "json") {
        this.observeIncoming(frame.data);
        if (this.twilio && frame.data.event === "media") {
          const payload =
            (frame.data.media as { payload?: string } | undefined)?.payload ??
            "";
          this.tallyAudio(
            frame.at,
            undefined,
            Buffer.from(payload, "base64").length
          );
        }
      }
    }
  }

  private tallyAudio(at: number, track: number | undefined, bytes: number) {
    if (!this.format) return;
    this.audio.push({ at, track, ms: durationMs(bytes, this.format) });
  }

  private observeIncoming(data: Record<string, unknown>) {
    if (
      !this.twilio &&
      data.type === "session.start" &&
      this.scenario.role === "app"
    ) {
      this.learnFormat(data);
    }
    if (
      this.twilio &&
      data.event === "start" &&
      typeof data.streamSid === "string"
    ) {
      this.streamSid = data.streamSid;
    }
  }

  private observeOutgoing(data: Record<string, unknown>) {
    if (!this.twilio && data.type === "session.start") this.learnFormat(data);
  }

  private learnFormat(start: Record<string, unknown>) {
    const audio = start.audio as { codec?: string; rate?: number } | undefined;
    if (audio?.codec) this.format = parseFormat(audio.codec, audio.rate);
  }

  private anchor(step: Step): number {
    if (step.from) {
      const t = this.labels.get(step.from);
      if (t === undefined)
        throw new StepFailure(`label "${step.from}" has not run`);
      return t;
    }
    return this.prevEnd;
  }

  private deadline(step: Step, anchor: number): number {
    if (step.within_ms !== undefined) return anchor + step.within_ms;
    return Math.max(anchor, Date.now()) + this.timeout + (step.budget_ms ?? 0);
  }

  private checkTiming(index: number, step: Step, anchor: number, at: number) {
    const elapsed = at - anchor;
    const sample: TimingSample = {
      step: index,
      label: step.label,
      elapsedMs: elapsed
    };

    if (step.not_before_ms !== undefined && elapsed < step.not_before_ms) {
      throw new StepFailure(
        `arrived after ${elapsed} ms, expected not before ${step.not_before_ms} ms`
      );
    }
    if (step.within_ms !== undefined && elapsed > step.within_ms) {
      throw new StepFailure(
        `arrived after ${elapsed} ms, limit ${step.within_ms} ms`
      );
    }
    if (step.budget_ms !== undefined) {
      const harness = this.options.harness;
      if (!harness?.providerDelayBetween) {
        throw new StepFailure(
          "budget_ms needs a harness that reports provider delays"
        );
      }
      sample.adjustedMs = elapsed - harness.providerDelayBetween(anchor, at);
      if (sample.adjustedMs > step.budget_ms) {
        throw new StepFailure(
          `took ${sample.adjustedMs} ms after subtracting provider time (${elapsed} ms total), budget ${step.budget_ms} ms`
        );
      }
    }
    if (
      step.within_ms !== undefined ||
      step.budget_ms !== undefined ||
      step.not_before_ms !== undefined
    ) {
      this.result.samples.push(sample);
    }
  }

  private async expect(index: number, step: Step) {
    const pattern = interpolate(step.expect!, this.vars);
    const anchor = this.anchor(step);
    const items = this.peer.frames.items;
    let scanned = this.cursor;
    let closest: string | undefined;

    const found = await this.peer.frames.waitUntil(
      () => {
        this.absorb();
        for (; scanned < items.length; scanned++) {
          const frame = items[scanned];
          if (frame.kind !== "json") continue;
          const type = this.typeOf(frame.data);
          if (type && this.ignore.has(type)) continue;
          const r = match(pattern, frame.data);
          if (r.ok) return { index: scanned, frame };
          if (step.next) return { index: scanned, frame, mismatch: r.reason };
          if (
            type !== undefined &&
            type === this.typeOf(pattern as Record<string, unknown>)
          )
            closest = r.reason;
        }
        if (this.peer.frames.closed) return null;
        return undefined;
      },
      this.deadline(step, anchor)
    );

    if (!found) {
      const why =
        found === null ? "the peer closed the connection" : "timed out";
      throw new StepFailure(
        `no frame matched ${JSON.stringify(pattern)} (${why}${closest ? `; closest: ${closest}` : ""})`
      );
    }

    if ("mismatch" in found) {
      throw new StepFailure(
        `the next frame did not match: ${JSON.stringify(found.frame.data)} (${found.mismatch})`
      );
    }
    this.cursor = found.index + 1;
    this.checkTiming(index, step, anchor, found.frame.at);

    for (const [name, p] of Object.entries(step.capture ?? {})) {
      const value = getPath(
        (found.frame as Extract<Frame, { kind: "json" }>).data,
        p
      );
      if (value === undefined)
        throw new StepFailure(
          `capture ${name}: ${p} is not in the matched frame`
        );
      this.vars[name] = value;
    }
  }

  private async expectNone(step: Step) {
    const pattern = interpolate(step.expect_none!, this.vars);
    const items = this.peer.frames.items;
    let scanned = this.cursor;

    const violation = await this.peer.frames.waitUntil(() => {
      this.absorb();
      for (; scanned < items.length; scanned++) {
        const frame = items[scanned];
        if (frame.kind !== "json") continue;
        const type = this.typeOf(frame.data);
        if (type && this.ignore.has(type)) continue;
        if (match(pattern, frame.data).ok) return frame;
      }
      return undefined;
    }, Date.now() + step.for_ms!);

    if (violation) {
      throw new StepFailure(
        `unexpected frame ${JSON.stringify((violation as { data: unknown }).data)}`
      );
    }
  }

  private async expectAudio(index: number, step: Step) {
    const { track, ms } = step.expect_audio!;
    const pattern = typeof ms === "number" ? { $gte: ms } : (ms ?? { $gt: 0 });
    const anchor = this.anchor(step);
    let total = 0;

    const at = await this.peer.frames.waitUntil(
      () => {
        this.absorb();
        total = 0;
        for (const a of this.audio) {
          if (a.at < anchor) continue;
          if (track !== undefined && a.track !== undefined && a.track !== track)
            continue;
          total += a.ms;
          if (match(pattern, Math.round(total)).ok) return a.at;
        }
        return undefined;
      },
      this.deadline(step, anchor)
    );

    if (at === undefined) {
      if (!this.format)
        throw new StepFailure("audio format unknown: no session.start seen");
      throw new StepFailure(
        `received ${Math.round(total)} ms of audio, expected ${JSON.stringify(pattern)}`
      );
    }
    this.checkTiming(index, step, anchor, at);
  }

  private async expectClose(index: number, step: Step) {
    const anchor = this.anchor(step);
    const closed = await this.peer.frames.waitUntil(
      () => this.peer.frames.closed,
      this.deadline(step, anchor)
    );
    if (!closed) throw new StepFailure("the connection is still open");
    const want = step.expect_close!.code;
    if (want !== undefined && closed.code !== want) {
      throw new StepFailure(
        `closed with code ${closed.code}, expected ${want}`
      );
    }
    this.checkTiming(index, step, anchor, closed.at);
  }

  private async assert(
    index: number,
    assertions: Record<string, unknown>,
    since: number
  ) {
    const harness = this.options.harness;
    for (const [name, expected] of Object.entries(assertions)) {
      const measured = harness?.measure
        ? await harness.measure(name, since)
        : undefined;
      if (measured !== undefined) {
        this.result.measurements.push({ step: index, name, value: measured });
      }
      if (measured === undefined)
        throw new StepFailure(`the harness cannot measure "${name}"`);
      const r = match(interpolate(expected, this.vars), measured);
      if (!r.ok) throw new StepFailure(`${name}: ${r.reason}`);
    }
  }

  // ---- outgoing audio --------------------------------------------------------------------

  private audioBuffer(source: AudioSource, format: AudioFormat): Buffer {
    const kind = source.kind ?? "tone";
    if (kind === "file") {
      if (!source.file)
        throw new StepFailure("send_audio kind file needs a file");
      const file = path.join(
        this.options.audioDir ?? path.join(SCENARIOS_DIR, "audio"),
        source.file
      );
      const pcm = fs.readFileSync(file);
      if (format.rate !== 16000) {
        throw new StepFailure(
          `audio files are 16 kHz and the session runs at ${format.rate} Hz`
        );
      }
      const buf = fromPcm16le(pcm, format);
      return source.ms === undefined
        ? buf
        : buf.subarray(
            0,
            Math.round((format.rate / 1000) * source.ms) *
              (format.codec === "pcmu" ? 1 : 2)
          );
    }
    return encode(generate(kind, source.ms ?? FRAME_MS, format.rate), format);
  }

  private async sendAudio(source: AudioSource) {
    this.absorb();
    if (!this.format)
      throw new StepFailure("audio format unknown: no session.start seen");
    const chunks = splitFrames(
      this.audioBuffer(source, this.format),
      this.format
    );
    const realtime = source.realtime ?? true;
    const start = Date.now();

    for (const [i, chunk] of chunks.entries()) {
      if (realtime) {
        const due = start + i * FRAME_MS;
        const wait = due - Date.now();
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      }
      this.sendFrame(chunk, source.track);
    }
  }

  private sendFrame(chunk: Buffer, track?: number) {
    if (this.twilio) {
      if (!this.streamSid)
        throw new StepFailure(
          "no streamSid yet: send_audio needs the start message first"
        );
      this.peer.sendJson({
        event: "media",
        streamSid: this.streamSid,
        media: { payload: chunk.toString("base64") }
      });
      return;
    }
    if (this.scenario.role === "gateway") {
      // Frames from the gateway start with the track id (voice-session, Listen-only sockets).
      this.peer.sendBinary(Buffer.concat([Buffer.from([track ?? 1]), chunk]));
      return;
    }
    this.peer.sendBinary(chunk);
  }
}
