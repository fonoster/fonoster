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
import { Flags } from "@oclif/core";

/** Flags shared by `applications:create` and `applications:update` (the session app model). */
export const applicationFlags = {
  "from-file": Flags.string({
    char: "f",
    description:
      "a YAML or JSON file with the Application (an `assistant` key makes it an Autopilot app)"
  }),
  name: Flags.string({ char: "n", description: "the Application name" }),
  url: Flags.string({
    char: "u",
    description: "the app's WebSocket URL (ws:// or wss://)"
  }),
  flavor: Flags.string({
    description: "the session protocol the app speaks",
    options: ["native", "twilio"]
  }),
  assistant: Flags.string({
    char: "a",
    description:
      "a YAML or JSON assistant file; makes it an Autopilot app (hosted by Fonoster)"
  }),
  voice: Flags.string({
    description: "TTS voice as a catalog id (e.g. deepgram/aura-2-thalia-en)"
  }),
  language: Flags.string({ description: "speech language (e.g. en-US)" }),
  "stt-model": Flags.string({
    description: "STT model as a catalog id (e.g. deepgram/nova-3)"
  }),
  "tts-model": Flags.string({
    description: "TTS model as a catalog id (e.g. elevenlabs/eleven_flash_v2_5)"
  }),
  "silence-timeout": Flags.integer({
    description: "milliseconds of caller silence before a silence event"
  }),
  patience: Flags.string({
    description: "how long to wait before taking the turn",
    options: ["low", "normal", "high"]
  }),
  "audio-codec": Flags.string({
    description: "audio frames for native apps",
    options: ["pcm16", "pcmu"]
  }),
  "audio-rate": Flags.integer({
    description:
      "audio sample rate for native apps: 8000, 16000 or 24000 (pcmu is 8000 only)"
  }),
  "fallback-app": Flags.string({
    description: "the Application to hand the call to when this app fails"
  }),
  "fallback-message": Flags.string({
    description:
      "what the caller hears when the app fails and no fallback app answers"
  }),
  listener: Flags.string({
    char: "l",
    description:
      "a listen-only socket: <wss-url>[,inbound|outbound|both] (repeatable, at most 4)",
    multiple: true
  }),
  "clear-listeners": Flags.boolean({
    description:
      "remove the current listeners (update; combine with --listener to replace)",
    default: false
  }),
  recording: Flags.string({
    description: "the recording policy",
    options: ["off", "on", "consent"]
  }),
  amd: Flags.boolean({
    description:
      "answering-machine detection: the app gets one amd.result per call (--no-amd turns it off)",
    allowNo: true
  }),
  "amd-window": Flags.integer({
    description:
      "milliseconds of caller audio AMD classifies (500 to 15000, default 4000); implies --amd"
  })
};
