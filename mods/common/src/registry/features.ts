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
import { Capability } from "./types";

/**
 * The feature vocabulary (add-provider-registry, P8). Hard features are needed for a config to
 * work at all; soft ones only degrade it (and their settings are dropped on retirement).
 */
export const FEATURES: Record<Capability, Record<string, "hard" | "soft">> = {
  llm: {
    "tool-calling": "hard",
    streaming: "hard",
    "json-mode": "soft",
    vision: "soft"
  },
  tts: { streaming: "hard", "word-timings": "soft", ssml: "soft" },
  stt: {
    streaming: "hard",
    "interim-results": "soft",
    "word-timings": "soft",
    "turn-detection": "soft",
    multilingual: "soft"
  },
  // Noise cancelling has no model entries yet; the provider itself is the unit.
  nc: {}
};

export function unknownFeatures(
  type: Capability,
  features: string[]
): string[] {
  return features.filter((f) => !(f in FEATURES[type]));
}

/** Hard requirements derived from an agent config: tools need tool calling, replies stream. */
export function agentRequirements(agent: {
  languageModel?: { tools?: unknown[] };
}): string[] {
  const req = ["streaming"];
  if ((agent.languageModel?.tools ?? []).length) req.push("tool-calling");
  return req;
}
