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
import { BackchannelDetector } from "./BackchannelDetector";
import { BaselineDetector, Detector } from "./Detector";
import { RemoteDetector } from "./remote";
import { SttTurnDetector } from "./SttTurnDetector";

// Which Detector an app uses (turn-taking, "Detectors are pluggable behind one interface"):
// chosen per app in its speech settings, never by the app's code or the session protocol.

export const DETECTORS = ["baseline", "backchannel-hold", "stt"] as const;
export type DetectorName = (typeof DETECTORS)[number];

export type DetectorSettings = {
  silenceTimeoutMs: number;
  /** A built-in name or the ws:// URL of an out-of-process Detector. Default: baseline. */
  detector?: string;
};

export function isDetectorChoice(value: string): boolean {
  return (
    (DETECTORS as readonly string[]).includes(value) || /^wss?:\/\//.test(value)
  );
}

export function createDetector(
  settings: DetectorSettings,
  hooks: { onSource?: (source: "remote" | "fallback", reason?: string) => void } = {}
): { detector: Detector; version: string } {
  const choice = settings.detector ?? "baseline";
  const baseline = () =>
    new BaselineDetector({ silenceTimeoutMs: settings.silenceTimeoutMs });
  if (/^wss?:\/\//.test(choice))
    return {
      detector: new RemoteDetector({
        url: choice,
        fallback: baseline(),
        onSource: hooks.onSource
      }),
      version: "remote@1"
    };
  switch (choice) {
    case "backchannel-hold":
      return {
        detector: new BackchannelDetector({
          silenceTimeoutMs: settings.silenceTimeoutMs
        }),
        version: "backchannel-hold@1"
      };
    case "stt":
      return { detector: new SttTurnDetector(), version: "stt@1" };
    default:
      return { detector: baseline(), version: "baseline@1" };
  }
}
