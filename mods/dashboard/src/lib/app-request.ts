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
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest
} from "@fonoster/types";

// UpdateApplication replaces every column of the session app model (apiserver
// applications/session/appModel.ts): a field left out is cleared. Every update the dashboard sends
// starts from the app's full current state (this function) and overlays only what was edited.

type Speech = NonNullable<CreateApplicationRequest["speech"]>;

/** Drops proto3's "" and 0 placeholders. */
const set = <T>(v: T | "" | 0 | null | undefined): T | undefined =>
  v === "" || v === 0 || v === null || v === undefined ? undefined : v;

/** An app as read back, as the request that would save it unchanged. */
export function applicationToRequest(
  app: Application
): CreateApplicationRequest {
  const speech = (app.speech ?? {}) as Speech;
  const config = app.intelligence?.config;
  return {
    name: app.name,
    type: app.type,
    url: set(app.url),
    protocol: set(app.protocol),
    speech: {
      voice: set(speech.voice),
      language: set(speech.language),
      sttModel: set(speech.sttModel),
      ttsModel: set(speech.ttsModel),
      silenceTimeoutMs: set(speech.silenceTimeoutMs),
      patience: set(speech.patience)
    },
    audio: app.audio?.codec
      ? { codec: app.audio.codec, rate: app.audio.rate }
      : undefined,
    fallbackAppRef: set(app.fallbackAppRef),
    fallbackMessage: set(app.fallbackMessage),
    listeners: (app.listeners ?? []).map((l) => ({
      url: l.url,
      tracks: l.tracks ?? "both"
    })),
    recording: set(app.recording),
    filters: (app.filters ?? []).map((f) => ({
      name: f.name,
      ...(f.options && Object.keys(f.options).length
        ? { options: f.options }
        : {})
    })),
    amd: app.amd?.enabled
      ? {
          enabled: true,
          ...(app.amd.windowMs ? { windowMs: app.amd.windowMs } : {})
        }
      : undefined,
    ...(config ? { intelligence: { config } } : {})
  };
}

/**
 * The update request for `base` with `edits` applied: fields in `edits` win (an explicit
 * undefined clears), everything else keeps its saved value. Speech merges per field.
 */
export function mergeUpdate(
  base: Application,
  edits: Partial<CreateApplicationRequest>
): UpdateApplicationRequest {
  const current = applicationToRequest(base);
  return {
    ...current,
    ...edits,
    ref: base.ref,
    speech: { ...current.speech, ...edits.speech }
  };
}
