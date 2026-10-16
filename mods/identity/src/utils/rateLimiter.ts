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
 * Fixed-window counter kept in this process's memory. With several replicas
 * each enforces its own limit; a shared store is future work.
 */
function createRateLimiter(params: { limit: number; windowMs: number }) {
  const { limit, windowMs } = params;
  const windows = new Map<string, { startedAt: number; count: number }>();

  /** Counts one use of `key`; false when it's over the limit. */
  return function tryConsume(key: string, now = Date.now()): boolean {
    const window = windows.get(key);

    if (!window || now - window.startedAt >= windowMs) {
      windows.set(key, { startedAt: now, count: 1 });
      // Keep the map from growing without bound.
      if (windows.size > 10_000) {
        windows.forEach((w, k) => {
          if (now - w.startedAt >= windowMs) windows.delete(k);
        });
      }
      return true;
    }

    if (window.count >= limit) {
      return false;
    }

    window.count += 1;
    return true;
  };
}

export { createRateLimiter };
