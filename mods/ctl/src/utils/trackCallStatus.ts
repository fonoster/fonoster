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
// The dial ends at one of these; the stream may stay open a moment after (the server closes it).
const FINAL = ["ANSWER", "BUSY", "CANCEL", "FAILED", "NOANSWER", "ERROR"];

/**
 * Prints each dial status (with why the call ended, when the server says) until a final one
 * (or the stream ends); returns the last status.
 */
export async function trackCallStatus(
  statusStream: AsyncIterable<{ status: string; hangupCause?: string }>,
  log: (message: string) => void
): Promise<string | undefined> {
  let last: string | undefined;
  // eslint-disable-next-line no-loops/no-loops
  for await (const entry of statusStream) {
    last = entry.status;
    const cause = entry.hangupCause ? ` (${entry.hangupCause})` : "";
    log(`Call status: ${entry.status}${cause}`);
    if (FINAL.includes(entry.status)) break;
  }
  return last;
}
