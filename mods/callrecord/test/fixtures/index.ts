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
import { CallRecordWriter, RecordEntry } from "../../src";

// Fixture calls (add-call-record task 1.2, LO-B8): scripted working records, with synthetic
// two-sided audio for recorded calls. Each file in calls/ is one call; `expect` states what its
// sealed record must show. Recorded audio of real callers is not included.

export type ToneSpan = { fromMs: number; toMs: number };

export type FixtureCall = {
  name: string;
  description: string;
  callRef: string;
  /** No hangup: the call is left open, as after a gateway crash (sealed by the sweep). */
  open?: boolean;
  /** Recording: starts `startMs` after the first entry; tones where each side speaks. */
  audio?: { startMs: number; caller: ToneSpan[]; agent: ToneSpan[] };
  entries: {
    atMs: number;
    source: RecordEntry["source"];
    message: Record<string, unknown>;
  }[];
  expect: {
    status: "completed" | "failed" | "incomplete";
    redactions: number;
    missing: string[];
    agents: string[];
    /** none, same (both copies reference one recording) or beeped (the redacted copy's is). */
    recording: "none" | "same" | "beeped";
  };
};

const DIR = path.join(__dirname, "calls");

export const FIXTURE_CALLS = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

export function loadFixtureCall(name: string): FixtureCall {
  return {
    name,
    ...JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), "utf8"))
  };
}

/** The base time fixtures are played at. */
export const FIXTURE_T0 = Date.parse("2026-10-15T09:00:00.000Z");

const RATE = 16000;
const AMPLITUDE = { caller: 3000, agent: -3000 };

/** One side's raw 16 kHz PCM: a constant level where it speaks, silence elsewhere. */
function track(spans: ToneSpan[], side: "caller" | "agent", startMs: number) {
  const end = Math.max(0, ...spans.map((s) => s.toMs)) - startMs;
  const pcm = Buffer.alloc(Math.max(0, Math.ceil((end * RATE) / 1000)) * 2);
  for (const s of spans) {
    const a = Math.max(0, Math.floor(((s.fromMs - startMs) * RATE) / 1000));
    const b = Math.min(
      pcm.length / 2,
      Math.ceil(((s.toMs - startMs) * RATE) / 1000)
    );
    for (let i = a; i < b; i++) pcm.writeInt16LE(AMPLITUDE[side], i * 2);
  }
  return pcm;
}

/** Writes the fixture into a writer (audio as the recorder leaves it) and seals it. */
export async function playFixtureCall(
  writer: CallRecordWriter,
  fixture: FixtureCall,
  t0 = FIXTURE_T0
) {
  if (fixture.audio) {
    const dir = writer.recordingDir(fixture.callRef);
    fs.mkdirSync(dir, { recursive: true });
    const startMs = fixture.audio.startMs;
    fs.writeFileSync(
      path.join(dir, "meta.json"),
      JSON.stringify({
        startedAt: t0 + startMs,
        rate: RATE,
        sides: ["caller", "agent"]
      })
    );
    fs.writeFileSync(
      path.join(dir, "caller.pcm"),
      track(fixture.audio.caller, "caller", startMs)
    );
    fs.writeFileSync(
      path.join(dir, "agent.pcm"),
      track(fixture.audio.agent, "agent", startMs)
    );
  }
  for (const e of fixture.entries)
    writer.append(fixture.callRef, {
      at: t0 + e.atMs,
      source: e.source,
      message: e.message
    });
  if (fixture.open) {
    // A crashed gateway: another replica's sweep seals it after the deadline.
    const other = writer as unknown as { active: Set<string> };
    other.active.delete(fixture.callRef);
    await writer.sweep(Date.now() + 10 * 60_000);
  } else writer.close(fixture.callRef);
  await writer.flush();
}
