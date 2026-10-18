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

// Reads little-endian signed 16-bit PCM. Node Buffers are often slices of a
// shared pool at an odd offset, which an Int16Array view can't start at, so
// those are copied first.
function bufferToInt16(buffer: Buffer): Int16Array {
  const samples = Math.floor(buffer.length / 2);

  if (buffer.byteOffset % 2 === 0) {
    return new Int16Array(buffer.buffer, buffer.byteOffset, samples);
  }

  const copy = new Uint8Array(samples * 2);
  copy.set(buffer.subarray(0, samples * 2));

  return new Int16Array(copy.buffer, 0, samples);
}

function int16ToBuffer(samples: Int16Array): Buffer {
  return Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
}

export { bufferToInt16, int16ToBuffer };
