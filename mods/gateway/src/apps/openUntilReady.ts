#!/usr/bin/env node
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
/**
 * Retries a store's first load while the control-plane database is not ready yet (the API server
 * applies its migrations at start, so its tables may not exist for a few seconds). Each failed
 * attempt logs one warn line; after `timeoutMs` the last error is thrown and the gateway exits.
 */
type Log = { warn: (message: string) => void; info: (message: string) => void };

export type OpenUntilReadyOptions = {
  /** Wait between attempts (default 2 s). */
  retryMs?: number;
  /** Give up after this long (default 2 min). */
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

export async function openUntilReady<T>(
  what: string,
  open: () => Promise<T>,
  logger: Log,
  options: OpenUntilReadyOptions = {}
): Promise<T> {
  const retryMs = options.retryMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const sleep =
    options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const now = options.now ?? Date.now;
  const start = now();
  for (let attempt = 1; ; attempt++) {
    try {
      const value = await open();
      if (attempt > 1) logger.info(`${what} loaded (attempt ${attempt})`);
      return value;
    } catch (e) {
      if (now() - start + retryMs > timeoutMs) throw e;
      const reason = ((e as Error).message ?? String(e)).split("\n").pop();
      logger.warn(
        `${what} not ready yet, retrying in ${retryMs / 1000}s (the API server may still be applying migrations): ${reason}`
      );
      await sleep(retryMs);
    }
  }
}
