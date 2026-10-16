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
import { Registry } from "@fonoster/common";

// Legacy product names → the provider registry's catalog ids (add-provider-registry 5.1).
// Legacy rows name a vendor by Product (`ProductVendor` + `ProductType`, refs like `tts.elevenlabs`)
// and models and voices by the vendor's raw name; the catalog uses `<provider>/<name>`.

/** ProductVendor → catalog provider id (= its built-in adapter). Vendors without one map to nothing. */
export const VENDOR_PROVIDERS: Record<string, string | undefined> = {
  GOOGLE: "google",
  MICROSOFT: "azure",
  DEEPGRAM: "deepgram",
  OPENAI: "openai",
  GROQ: "groq",
  ANTHROPIC: "anthropic",
  ELEVEN_LABS: "elevenlabs",
  AMAZON: undefined,
  IBM: undefined,
  RASA: undefined,
  GENERIC: undefined
};

/** A product ref's vendor part (`tts.elevenlabs` → `elevenlabs`) as a catalog provider id. */
export function providerOfProductRef(productRef?: string | null) {
  const vendor = productRef?.split(".")[1];
  if (!vendor) return undefined;
  const normalized = vendor.toLowerCase().replace(/[^a-z0-9]/g, "");
  const known = Object.values(VENDOR_PROVIDERS).filter(Boolean) as string[];
  return known.includes(normalized) ? normalized : undefined;
}

export const credentialRefFor = (providerId: string) => `${providerId}-default`;

/** ProductType → registry capability. */
export const PRODUCT_TYPES: Record<string, Registry.Capability> = {
  TTS: "tts",
  STT: "stt",
  LLM: "llm"
};

const DEEPGRAM_TTS = (voice: string) =>
  voice.startsWith("aura-2-") ? "deepgram/aura-2" : "deepgram/aura";

/** The TTS model a legacy voice runs on, as a catalog id. */
export function ttsModelFor(
  providerId: string,
  voice: string,
  config: Record<string, unknown> = {}
): string {
  if (providerId === "deepgram") return DEEPGRAM_TTS(voice);
  if (providerId === "elevenlabs")
    return `elevenlabs/${typeof config.model === "string" && config.model ? config.model : "eleven_flash_v2_5"}`;
  return `${providerId}/tts`;
}

/** A model or voice name as a catalog id; names already prefixed with the provider are kept. */
export function catalogId(providerId: string, name: string) {
  return name.startsWith(`${providerId}/`) ? name : `${providerId}/${name}`;
}
