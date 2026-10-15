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
import { randomBytes } from "crypto";
import {
  LegacyApplication,
  LegacySpeechProduct,
  MigratedApplication,
  MigrationNotice,
  MigrationOptions
} from "./types";

export const newSigningSecret = () => randomBytes(32).toString("base64url");

/** `tts.elevenlabs` → `elevenlabs`. */
function vendorOf(product?: LegacySpeechProduct | null): string | undefined {
  return product?.productRef?.split(".")[1];
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** A gRPC `host:port` becomes `ws://host:port`; ws:// and wss:// URLs pass through. */
function urlFromEndpoint(endpoint: string): string | undefined {
  const e = endpoint?.trim();
  if (!e) return undefined;
  if (/^wss?:\/\//.test(e)) return e;
  if (/^https?:\/\//.test(e)) return e.replace(/^http/, "ws");
  return `ws://${e}`;
}

/** AUTOPILOT apps share the hosted Autopilot's secret when it is given. */
function hostedSecret(legacy: LegacyApplication, options: MigrationOptions) {
  return legacy.type === "AUTOPILOT"
    ? options.autopilotSigningSecret
    : undefined;
}

/**
 * Converts one legacy Application to the new app model, with notices for anything an operator or
 * the app's owner must act on. `existing` keeps a previous run's signing secret (re-runs are
 * idempotent and never rotate secrets, which would break running apps, B25).
 */
export function convertLegacyApplication(
  legacy: LegacyApplication,
  options: MigrationOptions,
  existing?: MigratedApplication
): { app?: MigratedApplication; notices: MigrationNotice[] } {
  const notices: MigrationNotice[] = [];
  const note = (level: MigrationNotice["level"], message: string) =>
    notices.push({ ref: legacy.ref, level, message });

  let url: string | undefined;
  if (legacy.type === "AUTOPILOT") {
    url = options.autopilotUrl;
    if (!url) {
      note(
        "action",
        "AUTOPILOT app skipped: set the hosted Autopilot URL (autopilotUrl)"
      );
      return { notices };
    }
    note(
      "info",
      "Autopilot app: served by the hosted Autopilot (native flavor); its assistant config stays on the app and is read by appRef"
    );
  } else {
    url =
      options.urlOverrides?.[legacy.ref] ?? urlFromEndpoint(legacy.endpoint);
    if (!url) {
      note("action", "EXTERNAL app skipped: no endpoint and no URL override");
      return { notices };
    }
    if (!options.urlOverrides?.[legacy.ref]) {
      note(
        "action",
        `EXTERNAL app now dialed at ${url}: the app must serve the session protocol there (@fonoster/voice session SDK); a gRPC VoiceServer stops answering at the cutover`
      );
    }
  }

  const ttsVendor = vendorOf(legacy.textToSpeech);
  const ttsVoice = str(legacy.textToSpeech?.config?.voice);
  let voice = options.defaults.voice;
  if (ttsVendor && ttsVoice) {
    voice = `${ttsVendor}/${ttsVoice}`;
  } else if (ttsVendor) {
    note(
      "info",
      `no voice set for ${ttsVendor}; using the default ${options.defaults.voice}`
    );
  }

  const language =
    str(legacy.speechToText?.config?.languageCode) ??
    str(legacy.textToSpeech?.config?.languageCode) ??
    options.defaults.language;

  const sttVendor = vendorOf(legacy.speechToText);
  if (sttVendor && sttVendor !== "deepgram") {
    note(
      "info",
      `STT vendor ${sttVendor} is not chosen per app any more; the gateway's STT provider applies`
    );
  }
  const sttModel = str(legacy.speechToText?.config?.model);
  if (sttModel) {
    note(
      "info",
      `STT model ${sttModel} is not part of the app model; it moves to the provider configuration`
    );
  }
  for (const [kind, product] of [
    ["TTS", legacy.textToSpeech],
    ["STT", legacy.speechToText],
    ["LLM", legacy.intelligence]
  ] as const) {
    if (product?.credentials) {
      note(
        "action",
        `${kind} has its own credentials: move them to a workspace secret (bring-your-own-key) before the cutover`
      );
    }
  }

  const app: MigratedApplication = {
    ref: legacy.ref,
    name: legacy.name,
    workspaceRef: legacy.accessKeyId,
    url,
    flavor: "native",
    signingSecret:
      hostedSecret(legacy, options) ??
      existing?.signingSecret ??
      (options.newSecret ?? newSigningSecret)(),
    speech: { voice, language },
    ...(existing?.fallback
      ? { fallback: existing.fallback }
      : options.fallbackMessage
        ? { fallback: { message: options.fallbackMessage } }
        : {})
  };
  if (!existing && !hostedSecret(legacy, options)) {
    note(
      "action",
      "new signing secret: give it to the app (APP_SIGNING_SECRET) so it can verify the gateway"
    );
  }
  return { app, notices };
}
