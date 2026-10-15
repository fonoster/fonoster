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
const SENTENCE_END = /[.!?](["')\]]*)\s+/;
const MAX_PIECE = 160;

/**
 * Groups streamed tokens into sentence-sized pieces, so each speak piece is a natural unit for TTS
 * while the first sentence still starts before the reply is complete (rework-autopilot A5).
 */
export async function* sentences(
  tokens: AsyncIterable<string>
): AsyncIterable<string> {
  let buffer = "";
  for await (const token of tokens) {
    buffer += token;
    for (;;) {
      const m = SENTENCE_END.exec(buffer);
      if (m) {
        const end = m.index + m[0].length;
        yield buffer.slice(0, end);
        buffer = buffer.slice(end);
        continue;
      }
      if (buffer.length > MAX_PIECE) {
        const cut = buffer.lastIndexOf(" ", MAX_PIECE);
        if (cut > 0) {
          yield buffer.slice(0, cut + 1);
          buffer = buffer.slice(cut + 1);
          continue;
        }
      }
      break;
    }
  }
  if (buffer.trim()) yield buffer;
}
