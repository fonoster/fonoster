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
function chunkToFloat32Array(chunk: Uint8Array): Float32Array {
  // Create a DataView to handle endianness explicitly
  const dataView = new DataView(
    chunk.buffer,
    chunk.byteOffset,
    chunk.byteLength
  );
  const floatArray = new Float32Array(chunk.byteLength / 2);

  // Convert each 16-bit sample to float32, explicitly handling little-endian
  for (let i = 0; i < floatArray.length; i++) {
    // Read 16-bit value with explicit little-endian
    const int16Value = dataView.getInt16(i * 2, true); // true = little-endian
    // Normalize to [-1, 1]
    floatArray[i] = int16Value / 32768.0;
  }

  return floatArray;
}

export { chunkToFloat32Array };
