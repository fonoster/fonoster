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
import { streamingPost } from "../http";
import { Synthesis, TtsAdapter } from "../speech";

// ElevenLabs TTS, ported from mods/apiserver/src/voice/tts/ElevenLabs.ts onto the streaming
// adapter interface. Asks for raw 16 kHz PCM (AppBridge's internal format), so no conversion.
// Word timings (the with-timestamps endpoint) are not used yet; heardText then falls back to a
// proportional cut.

export type ElevenLabsOptions = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
};

export class ElevenLabsTtsAdapter implements TtsAdapter {
  constructor(private readonly options: ElevenLabsOptions) {}

  async synthesize(
    request: { text: string; voice: string; language: string },
    signal: AbortSignal
  ): Promise<Synthesis> {
    // The voice is an ElevenLabs voice id (catalog id "elevenlabs/<voice id>").
    const audio = await streamingPost(
      `${this.options.baseUrl ?? "https://api.elevenlabs.io"}/v1/text-to-speech/${encodeURIComponent(request.voice)}/stream?output_format=pcm_16000`,
      {
        headers: {
          "xi-api-key": this.options.apiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          text: request.text,
          model_id: this.options.model ?? "eleven_flash_v2_5"
        })
      },
      signal,
      this.options.timeoutMs ?? 3000,
      "ElevenLabs",
      "elevenlabs"
    );
    return { audio };
  }
}
