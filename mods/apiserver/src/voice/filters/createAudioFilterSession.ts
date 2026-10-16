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
import { AudioFilterFactory } from "./AudioFilterFactory";
import { AudioFilterChain, AudioFilterConfig, ChainStats } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type AudioFilterSession = {
  // The chain the audio path should use right now, or null for no filtering
  current(): AudioFilterChain | null;
  // Replaces the filters. Rejects if they cannot be applied, leaving the
  // previous filters (or none) in place.
  set(filters: AudioFilterConfig[]): Promise<void>;
  // Ends the session. Returns the stats of the chain that was running, if any.
  close(): ChainStats | null;
};

/**
 * Owns a call's filter chain: building it, replacing it, and making sure a
 * chain is drained before it is closed and that nothing is left running after
 * the call ends.
 */
function createAudioFilterSession(
  deps: {
    createChain: (filters: AudioFilterConfig[]) => AudioFilterChain;
  } = {
    createChain: (filters) => AudioFilterFactory.createChainFromConfig(filters)
  }
): AudioFilterSession {
  let chain: AudioFilterChain | null = null;
  let closed = false;

  // Frames may still be inside the chain, so let it finish before disposing
  // whatever the filters hold
  const retire = (retiring: AudioFilterChain | null) => {
    if (!retiring) {
      return;
    }

    retiring
      .drain()
      .catch(() => undefined)
      .then(() => retiring.close());
  };

  return {
    current: () => chain,

    async set(filters) {
      if (closed) {
        return;
      }

      if (filters.length === 0) {
        const previous = chain;
        chain = null;
        retire(previous);
        return;
      }

      // Throws on an unknown filter or invalid options, before anything runs
      const next = deps.createChain(filters);

      try {
        await next.ready();
      } catch (err) {
        next.close();
        throw err;
      }

      // ready() resolves even when a filter failed to start, because the
      // chain's job is to keep audio flowing. The application asked for
      // filtering though, so tell it rather than pretending it is on.
      const failed = next
        .getStats()
        .filters.filter((filter) => filter.disabled);

      if (failed.length > 0) {
        next.close();
        throw new Error(
          `could not start audio filter(s): ${failed
            .map((filter) => `${filter.name}: ${filter.error}`)
            .join("; ")}`
        );
      }

      // The call can end while a model is loading; don't resurrect it
      if (closed) {
        next.close();
        return;
      }

      const previous = chain;
      chain = next;
      retire(previous);
    },

    close() {
      closed = true;

      const retiring = chain;
      chain = null;

      if (!retiring) {
        return null;
      }

      const stats = retiring.getStats();
      retire(retiring);

      logger.verbose("audio filter session closed", {
        frames: stats.total.frames
      });

      return stats;
    }
  };
}

export { AudioFilterSession, createAudioFilterSession };
