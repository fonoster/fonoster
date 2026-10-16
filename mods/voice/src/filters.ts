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
import { AudioFilterConfig } from "@fonoster/common";

/**
 * Options for the ai-coustics filter. Tuning only: the license key is read
 * from the Media Server's environment and never travels with the session.
 */
type AiCousticsOptions = {
  /** Model to load. Defaults to Quail Voice Focus at 16 kHz. */
  model?: string;
  /** 0 to 1. Higher values also suppress competing speech. Defaults to 1. */
  enhancementLevel?: number;
  /** Keeps the processing delay but stops enhancing. Useful for A/B tests. */
  bypass?: boolean;
};

/**
 * ai-coustics speech enhancement: keeps the primary speaker and suppresses
 * noise and competing voices.
 *
 * @param {AiCousticsOptions} options - Tuning options for the filter
 * @return {AudioFilterConfig} A filter to pass to `setAudioFilters`
 * @example
 *
 * await voice.setAudioFilters([aiCoustics({ enhancementLevel: 0.8 })]);
 * await voice.answer();
 */
function aiCoustics(options: AiCousticsOptions = {}): AudioFilterConfig {
  return { name: "aiCoustics", options };
}

export { aiCoustics, AiCousticsOptions };
