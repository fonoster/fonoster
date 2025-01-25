/*
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
// This version of the chunkToFloat32Array accounts for the case where
// the byteOffset is misaligned.
//
// Q. Would it be the same if we just created a new Uint8Array from the chunk?
function chunkToFloat32Array(chunk: Uint8Array): Float32Array {
  // Check if byteOffset is not aligned
  const alignedByteOffset =
    chunk.byteOffset % Int16Array.BYTES_PER_ELEMENT === 0;

  let int16Array: Int16Array;

  if (alignedByteOffset) {
    int16Array = new Int16Array(
      chunk.buffer,
      chunk.byteOffset,
      chunk.byteLength / Int16Array.BYTES_PER_ELEMENT
    );
  } else {
    // Create a new aligned Uint8Array and then an Int16Array from it
    const alignedChunk = new Uint8Array(chunk);
    int16Array = new Int16Array(
      alignedChunk.buffer,
      alignedChunk.byteOffset,
      alignedChunk.byteLength / Int16Array.BYTES_PER_ELEMENT
    );
  }

  const floatArray = new Float32Array(int16Array.length);

  for (let i = 0; i < int16Array.length; i++) {
    floatArray[i] = int16Array[i] / 32768.0;
  }

  return floatArray;
}

export { chunkToFloat32Array };
