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
import { ROUTR_DEFAULT_PEER_AOR } from "@fonoster/common";

/**
 * Which voice stack answers an app's numbers during the cutover (add-media-node 4.1):
 * `asterisk` is today's voice peer (sip:voice@default), `rebuild` is the media-node peer that Go
 * media nodes register under with least-sessions.
 */
export type VoiceEngine = "asterisk" | "rebuild";

export type EngineRoutingConfig = {
  /** Engine for apps and numbers not listed below (default `asterisk`). */
  defaultEngine?: VoiceEngine;
  /** The Asterisk peer AOR (default sip:voice@default). */
  asteriskAor?: string;
  /** The media-node peer AOR (default sip:medianode@default). */
  mediaNodeAor?: string;
  /** App refs whose numbers go to the media nodes. */
  rebuildApps?: string[];
  /** App refs kept on Asterisk (wins over `rebuildApps` and the default). */
  asteriskApps?: string[];
  /** Numbers (E.164, `+1555…`) to pin to an engine, e.g. a canary number; wins over the app. */
  numbers?: Record<string, VoiceEngine>;
  /**
   * Per-app lookup, e.g. an `engine` column on the Application row once it exists. Its answer wins
   * over the lists; undefined falls through to them.
   */
  engineOf?: (
    appRef: string
  ) => Promise<VoiceEngine | undefined> | VoiceEngine | undefined;
};

export const MEDIA_NODE_PEER_AOR = "sip:medianode@default";

export type NumberRouting = {
  /** The engine for an app-linked number. */
  engineFor(target: { appRef: string; telUrl?: string }): Promise<VoiceEngine>;
  /** The peer AOR (Number.aorLink) for an app-linked number. */
  aorFor(target: { appRef: string; telUrl?: string }): Promise<string>;
  /** The peer AOR of an engine. */
  aorOf(engine: VoiceEngine): string;
};

/** Every app on Asterisk: today's behavior when no routing is configured. */
export const ASTERISK_ONLY: EngineRoutingConfig = {};

export function createNumberRouting(
  config: EngineRoutingConfig = ASTERISK_ONLY
): NumberRouting {
  const aorOf = (engine: VoiceEngine) =>
    engine === "rebuild"
      ? (config.mediaNodeAor ?? MEDIA_NODE_PEER_AOR)
      : (config.asteriskAor ?? ROUTR_DEFAULT_PEER_AOR);

  const engineFor = async ({
    appRef,
    telUrl
  }: {
    appRef: string;
    telUrl?: string;
  }): Promise<VoiceEngine> => {
    const pinned = telUrl
      ? config.numbers?.[telUrl.replace(/^tel:/, "")]
      : undefined;
    if (pinned) return pinned;
    const looked = config.engineOf ? await config.engineOf(appRef) : undefined;
    if (looked) return looked;
    if (config.asteriskApps?.includes(appRef)) return "asterisk";
    if (config.rebuildApps?.includes(appRef)) return "rebuild";
    return config.defaultEngine ?? "asterisk";
  };

  return {
    engineFor,
    aorFor: async (target) => aorOf(await engineFor(target)),
    aorOf
  };
}
