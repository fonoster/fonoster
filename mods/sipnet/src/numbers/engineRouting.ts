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
 * Where app-linked numbers point (add-roomr 4.1). Asterisk is retired (cleanbreak CB-B3):
 * every app-linked number goes to the roomr peer that Go Roomr nodes register under with
 * least-sessions. `rebuild` is the only engine left; the type stays so repoint reports keep
 * their shape.
 */
export type VoiceEngine = "rebuild";

export type EngineRoutingConfig = {
  /** The roomr peer AOR (default sip:roomr@default). */
  roomrNodeAor?: string;
};

export const ROOMR_PEER_AOR = ROUTR_DEFAULT_PEER_AOR;

/** The AOR of the retired Asterisk peer, for moving numbers created before the rebuild. */
export const LEGACY_ASTERISK_PEER_AOR = "sip:voice@default";

export type NumberRouting = {
  /** The engine for an app-linked number. */
  engineFor(target: { appRef: string; telUrl?: string }): Promise<VoiceEngine>;
  /** The peer AOR (Number.aorLink) for an app-linked number. */
  aorFor(target: { appRef: string; telUrl?: string }): Promise<string>;
  /** The peer AOR of an engine. */
  aorOf(engine: VoiceEngine): string;
};

export function createNumberRouting(
  config: EngineRoutingConfig = {}
): NumberRouting {
  const aor = config.roomrNodeAor ?? ROOMR_PEER_AOR;
  return {
    engineFor: async () => "rebuild",
    aorFor: async () => aor,
    aorOf: () => aor
  };
}
