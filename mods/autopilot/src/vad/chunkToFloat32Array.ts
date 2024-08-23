/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
function chunkToFloat32Array(chunk: Float32Array): Float32Array {
  const int16Array = new Int16Array(
    chunk.buffer,
    chunk.byteOffset,
    chunk.byteLength / Int16Array.BYTES_PER_ELEMENT
  );

  return new Float32Array(Array.from(int16Array, (sample) => sample / 32768.0));
}

export { chunkToFloat32Array };
