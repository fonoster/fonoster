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
 * Keeps a value stable across a call's lifetime (keyed by callId), pruned by
 * age rather than by guessing which event is "final" from its fields.
 */
function createPerCallCache<T>(ttlMs: number) {
  const store = new Map<string, { value: T; lastSeenAt: number }>();

  const pruneInterval = setInterval(
    () => {
      const cutoff = Date.now() - ttlMs;
      store.forEach(({ lastSeenAt }, key) => {
        if (lastSeenAt < cutoff) {
          store.delete(key);
        }
      });
    },
    Math.min(ttlMs, 60 * 60 * 1000)
  );
  pruneInterval.unref();

  return {
    get(key: string): T | undefined {
      return store.get(key)?.value;
    },
    set(key: string, value: T): void {
      store.set(key, { value, lastSeenAt: Date.now() });
    }
  };
}

export { createPerCallCache };
