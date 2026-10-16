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
import { ProbeResult } from "../probe/runProbe";

/**
 * In-memory correlation between an AGI session and the AudioSocket connection
 * it spawns, keyed by the UUID the AGI handler mints and passes as the
 * AudioSocket() argument. Both listeners live in the same process, so this is
 * a plain Map rather than anything cross-process.
 *
 * Carries the raw, mode-agnostic ProbeResult — not yet mapped to channel
 * variables, since only the AGI side knows which mode (compact/full) this
 * session asked for.
 */
const pending = new Map<string, { resolve: (result: ProbeResult) => void }>();

/** Called by the AGI handler right before it EXECs AudioSocket(). */
function registerPendingClassification(
  sessionId: string
): Promise<ProbeResult> {
  return new Promise((resolve) => {
    pending.set(sessionId, { resolve });
  });
}

/** Called by the AudioSocket connection handler once it has a result. */
function resolvePendingClassification(
  sessionId: string,
  result: ProbeResult
): void {
  const entry = pending.get(sessionId);
  if (!entry) return;
  pending.delete(sessionId);
  entry.resolve(result);
}

/** Called by the AGI handler in its `finally`, in case nothing ever resolved it. */
function unregisterPendingClassification(sessionId: string): void {
  pending.delete(sessionId);
}

export {
  registerPendingClassification,
  resolvePendingClassification,
  unregisterPendingClassification
};
