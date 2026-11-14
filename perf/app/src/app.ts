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
// The app behind AppBridge in perf/compose.yaml: the fake TTS and STT AppBridge's `fake` provider
// calls, and the app its sessions dial. The primary forks one worker per core of its cpuset; the
// workers share the three ports, so the app stays far from its cores' limit. On SIGTERM or SIGINT
// the primary prints the workers' speak → output.started latencies and largest caller-audio gaps.
import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { stats, startApp } from "./session.ts";
import { settings } from "./settings.ts";
import { histogram, merge, summary } from "./stats.ts";
import { startStt } from "./stt.ts";
import { startTts } from "./tts.ts";
import type { Histogram } from "./stats.ts";

type WorkerStats = {
  speakStartMs: Histogram;
  maxCallerGapMs: Histogram;
  calls: number;
  hungUp: Record<string, number>;
};

function collect(): Promise<WorkerStats[]> {
  const workers = Object.values(cluster.workers ?? {}).filter((w) =>
    w?.isConnected()
  );
  return Promise.all(
    workers.map(
      (worker) =>
        new Promise<WorkerStats | undefined>((resolve) => {
          const timer = setTimeout(() => resolve(undefined), 3000);
          worker!.once("message", (msg: WorkerStats) => {
            clearTimeout(timer);
            resolve(msg);
          });
          worker!.send("stats");
        })
    )
  ).then((all) => all.filter((s): s is WorkerStats => !!s));
}

async function report() {
  const total: WorkerStats = {
    speakStartMs: histogram(),
    maxCallerGapMs: histogram(),
    calls: 0,
    hungUp: {}
  };
  for (const s of await collect()) {
    merge(total.speakStartMs, s.speakStartMs);
    merge(total.maxCallerGapMs, s.maxCallerGapMs);
    total.calls += s.calls;
    for (const [reason, n] of Object.entries(s.hungUp))
      total.hungUp[reason] = (total.hungUp[reason] ?? 0) + n;
  }
  console.log(
    JSON.stringify({
      event: "summary",
      calls: total.calls,
      hungUp: total.hungUp,
      speakStartMs: summary(total.speakStartMs),
      maxCallerGapMs: summary(total.maxCallerGapMs)
    })
  );
}

if (cluster.isPrimary) {
  const workers = availableParallelism();
  for (let i = 0; i < workers; i++) cluster.fork();
  cluster.on("exit", (worker, code, signal) => {
    if (!stopping)
      console.error(`worker ${worker.process.pid} exited (${signal ?? code})`);
  });
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await report();
    for (const worker of Object.values(cluster.workers ?? {})) worker?.kill();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  console.log(JSON.stringify({ event: "started", workers, settings }));
} else {
  startTts(settings.ttsPort);
  startStt(settings.sttPort, settings.sttFinalEveryMs);
  startApp(settings.appPort);
  process.on("message", (msg) => {
    if (msg === "stats") process.send?.(stats);
  });
  // The primary handles the signals; a worker stops when the primary kills it.
  process.on("SIGINT", () => undefined);
}
