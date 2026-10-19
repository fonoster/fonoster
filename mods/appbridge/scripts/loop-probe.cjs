/*
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
// Preloaded into each AppBridge by scripts/scale.ts (`node --require`): once a second appends the
// process's event-loop delay (ms) and CPU (% of one core) over that second to SCALE_PROBE_FILE.
const { monitorEventLoopDelay } = require("perf_hooks");
const fs = require("fs");
const { setInterval } = require("timers");
const { isMainThread } = require("worker_threads");

const RESOLUTION_MS = 10;
const lag = (ns) => Math.max(0, +(ns / 1e6 - RESOLUTION_MS).toFixed(2));

const file = process.env.SCALE_PROBE_FILE;
// --require also runs in loader threads (tsx's module hooks); only the main loop is measured.
if (file && isMainThread) {
  const delay = monitorEventLoopDelay({ resolution: RESOLUTION_MS });
  delay.enable();
  let cpu = process.cpuUsage();
  let at = Date.now();
  setInterval(() => {
    const used = process.cpuUsage(cpu);
    const now = Date.now();
    fs.appendFileSync(
      file,
      JSON.stringify({
        at: now,
        // The histogram includes the sampling interval itself; report only the lag beyond it.
        p50: lag(delay.percentile(50)),
        p99: lag(delay.percentile(99)),
        max: lag(delay.max),
        cpu: +(((used.user + used.system) / 1000 / (now - at)) * 100).toFixed(1)
      }) + "\n"
    );
    delay.reset();
    cpu = process.cpuUsage();
    at = now;
  }, 1000).unref();
}
