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
import { Readable } from "stream";
import { getLogger } from "@fonoster/logger";
import { textChunksByFirstNaturalPause } from "../../handlers/utils/textChunksByFirstNaturalPause";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/**
 * Creates a readable stream that processes text in chunks for better streaming performance.
 * This utility ensures that chunks are processed in parallel but streamed in the correct order.
 *
 * @param text - The text to be synthesized
 * @param synthesizeChunk - Function that processes each chunk and returns a Buffer or Readable
 * @returns A readable stream containing the synthesized audio
 */
export function createChunkedSynthesisStream(
  text: string,
  synthesizeChunk: (text: string, index: number) => Promise<Buffer | Readable>
): Readable {
  const chunks = textChunksByFirstNaturalPause(text);
  const stream = new Readable({ read() {} });

  if (chunks.length === 0) {
    logger.verbose("no text chunks to synthesize, returning empty stream");
    stream.push(null);
    return stream;
  }

  logger.verbose(`processing ${chunks.length} text chunks for synthesis`);

  const results = new Array(chunks.length);
  let nextIndexToPush = 0;
  let hasError = false;

  function observeQueue() {
    if (
      nextIndexToPush < results.length &&
      results[nextIndexToPush] !== undefined
    ) {
      stream.push(results[nextIndexToPush]);
      nextIndexToPush++;
      setImmediate(observeQueue);
    } else if (nextIndexToPush < results.length) {
      setTimeout(observeQueue, 10);
    } else {
      stream.push(null);
    }
  }

  observeQueue();

  chunks.forEach((chunkText, index) => {
    synthesizeChunk(chunkText, index)
      .then((synthesizedText) => {
        if (!hasError) {
          results[index] = synthesizedText;
        }
      })
      .catch((error) => {
        if (!hasError) {
          hasError = true;
          logger.error(`chunk synthesis failed: ${error.message}`);
          stream.emit("error", new Error(`Synthesis failed: ${error.message}`));
          stream.push(null);
        }
      });
  });

  return stream;
}
