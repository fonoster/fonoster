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
import { performance } from "perf_hooks";
import { getLogger } from "@fonoster/logger";
import {
  AudioFilter,
  AudioFilterChain,
  ChainStats,
  FilterTimingStats
} from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

// Keeps timing memory bounded on long calls
const MAX_TIMING_SAMPLES = 10000;

function createTimings() {
  const samples: number[] = [];
  let frames = 0;

  return {
    add(ms: number) {
      frames++;
      if (samples.length < MAX_TIMING_SAMPLES) {
        samples.push(ms);
      } else {
        samples[frames % MAX_TIMING_SAMPLES] = ms;
      }
    },
    summary(): FilterTimingStats {
      const sorted = [...samples].sort((a, b) => a - b);
      const at = (p: number) =>
        sorted.length === 0
          ? 0
          : sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];

      return {
        frames,
        p50Ms: at(0.5),
        p95Ms: at(0.95),
        maxMs: sorted.length === 0 ? 0 : sorted[sorted.length - 1]
      };
    }
  };
}

/**
 * Runs audio frames through filters in order. The chain is fail-open: a
 * filter that throws, rejects, or changes the frame length is disabled for
 * the rest of the stream and its input is passed through, so caller audio is
 * never dropped.
 */
function createAudioFilterChain(filters: AudioFilter[]): AudioFilterChain {
  const slots = filters.map((filter) => ({
    filter,
    timings: createTimings(),
    failures: 0,
    disabled: false,
    error: null as string | null
  }));
  const totalTimings = createTimings();

  // Serializes frames so output order matches input order even when callers
  // don't await or a filter is async
  let tail: Promise<unknown> = Promise.resolve();

  const disable = (slot: (typeof slots)[number], reason: string) => {
    slot.failures++;
    slot.disabled = true;
    slot.error = reason;
    logger.warn("audio filter disabled for the rest of the stream", {
      filter: slot.filter.name,
      reason
    });
  };

  const runSlot = async (
    slot: (typeof slots)[number],
    input: Int16Array
  ): Promise<Int16Array> => {
    if (slot.disabled) {
      return input;
    }

    const start = performance.now();

    try {
      const output = await slot.filter.process(input);
      slot.timings.add(performance.now() - start);

      if (output.length !== input.length) {
        disable(
          slot,
          `returned ${output.length} samples, expected ${input.length}`
        );
        return input;
      }

      return output;
    } catch (err) {
      slot.timings.add(performance.now() - start);
      disable(slot, (err as Error)?.message ?? String(err));
      return input;
    }
  };

  const run = async (frame: Int16Array): Promise<Int16Array> => {
    const chainStart = performance.now();

    const output = await slots.reduce(
      (previous, slot) => previous.then((input) => runSlot(slot, input)),
      Promise.resolve(frame)
    );

    totalTimings.add(performance.now() - chainStart);

    return output;
  };

  return {
    async ready() {
      await Promise.all(
        slots.map(async (slot) => {
          try {
            await slot.filter.ready?.();
          } catch (err) {
            disable(slot, (err as Error)?.message ?? String(err));
          }
        })
      );
    },

    drain() {
      return tail.then(
        () => undefined,
        () => undefined
      );
    },

    process(frame) {
      if (slots.length === 0) {
        return Promise.resolve(frame);
      }

      const result = tail.then(() => run(frame));
      tail = result.catch(() => undefined);

      return result;
    },

    getStats(): ChainStats {
      return {
        total: {
          ...totalTimings.summary(),
          delayMs: slots.reduce((sum, s) => sum + s.filter.delayMs, 0)
        },
        filters: slots.map((slot) => ({
          name: slot.filter.name,
          delayMs: slot.filter.delayMs,
          ...slot.timings.summary(),
          failures: slot.failures,
          disabled: slot.disabled,
          error: slot.error,
          filter: slot.filter.getStats?.() ?? {}
        }))
      };
    },

    inspect() {
      return Object.fromEntries(
        slots
          .filter((slot) => slot.filter.inspect)
          .map((slot) => [slot.filter.name, slot.filter.inspect!()])
      );
    },

    close() {
      slots.forEach((slot) => {
        try {
          slot.filter.close?.();
        } catch (err) {
          logger.warn("error closing audio filter", {
            filter: slot.filter.name,
            err
          });
        }
      });
    }
  };
}

export { createAudioFilterChain };
