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
import { WaveFile } from "wavefile";
import { streamToBuffer } from "./streamToBuffer";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/**
 * Converts a ulaw stream to PCM 16-bit at 8kHz
 *
 * @param readableStream - The input ulaw audio stream to convert
 * @returns A Promise that resolves to a Buffer containing PCM 16-bit audio data at 8kHz
 */
export async function convertUlawToPCM16(
  readableStream: Readable
): Promise<Buffer> {
  try {
    const inputBuffer = await streamToBuffer(readableStream);
    const wav = new WaveFile();

    wav.fromScratch(1, 8000, "8m", inputBuffer);
    wav.fromMuLaw();

    const waveBuffer = wav.toBuffer();

    return Buffer.from(
      waveBuffer.buffer,
      waveBuffer.byteOffset + 44,
      waveBuffer.byteLength - 44
    );
  } catch (error) {
    logger.error(`error converting audio format: ${error.message}`, {
      stack: error.stack
    });
    throw new Error(`Audio conversion failed: ${error.message}`);
  }
}
