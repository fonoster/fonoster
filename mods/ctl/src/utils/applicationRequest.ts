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
import { readFileSync } from "fs";
import path from "path";
import {
  Application,
  AppListener,
  CreateApplicationRequest
} from "@fonoster/types";
import { load } from "js-yaml";

// The session app model (voice-session G2): a WebSocket URL + flavor + speech defaults, or an
// Autopilot app (our hosted Autopilot + an assistant). The control plane replaces the whole app
// on update, so updates start from the current app and apply the changes (CLI-B1).

type ApplicationFlags = {
  name?: string;
  url?: string;
  flavor?: string;
  assistant?: string;
  voice?: string;
  language?: string;
  "stt-model"?: string;
  "tts-model"?: string;
  "silence-timeout"?: number;
  patience?: string;
  "audio-codec"?: string;
  "audio-rate"?: number;
  "fallback-app"?: string;
  "fallback-message"?: string;
  listener?: string[];
  "clear-listeners"?: boolean;
  recording?: string;
  amd?: boolean;
  "amd-window"?: number;
};

type AppRequest = CreateApplicationRequest & { ref?: string };

const TRACKS = ["inbound", "outbound", "both"];

/** Reads a YAML or JSON file into an object. */
function readConfigFile<T = Record<string, unknown>>(filePath: string): T {
  const content = readFileSync(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".yaml" || ext === ".yml") return load(content) as T;
  if (ext === ".json") return JSON.parse(content) as T;
  throw new Error("Unsupported file format. Please use YAML or JSON files.");
}

/** `wss://host/path` or `wss://host/path,inbound` (tracks: inbound, outbound or both). */
function parseListener(value: string): AppListener {
  const comma = value.lastIndexOf(",");
  const tail = comma > 0 ? value.slice(comma + 1).trim() : "";
  if (comma > 0 && TRACKS.includes(tail)) {
    return {
      url: value.slice(0, comma).trim(),
      tracks: tail as AppListener["tracks"]
    };
  }
  if (comma > 0 && tail && !tail.includes("/")) {
    throw new Error(
      `invalid listener tracks "${tail}" (use inbound, outbound or both)`
    );
  }
  return { url: value.trim(), tracks: "both" };
}

function blank(value: unknown) {
  return value === "" || value === 0 || value === null || value === undefined;
}

function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => !blank(v))
  ) as T;
}

/** The LLM product the control plane files the assistant under (`llm.<provider>`). */
function intelligenceFor(assistant: Record<string, unknown>) {
  const model = (assistant.languageModel as { model?: string } | undefined)
    ?.model;
  return {
    productRef: model?.includes("/") ? `llm.${model.split("/")[0]}` : "",
    config: assistant
  };
}

/** An existing app as a create/update request (blank fields dropped). */
function applicationToRequest(app: Application): AppRequest {
  const request: AppRequest = {
    name: app.name,
    type: app.type,
    flavor: (app.flavor || undefined) as AppRequest["flavor"],
    speech: compact({ ...(app.speech ?? {}) }),
    audio: app.audio?.codec ? app.audio : undefined,
    fallbackAppRef: app.fallbackAppRef || undefined,
    fallbackMessage: app.fallbackMessage || undefined,
    listeners: app.listeners ?? [],
    recording: (app.recording || undefined) as AppRequest["recording"],
    amd: app.amd?.enabled
      ? compact({ enabled: true, windowMs: app.amd.windowMs })
      : undefined
  };
  // Autopilot apps follow the operator's hosted Autopilot URL; only external apps carry theirs.
  if (app.type !== "AUTOPILOT") request.url = app.url || app.endpoint;
  const config = app.intelligence?.config;
  if (app.type === "AUTOPILOT" && config && Object.keys(config).length) {
    request.intelligence = intelligenceFor(config);
  }
  return compact(request as unknown as Record<string, unknown>) as AppRequest;
}

/** A file in the new app model; `assistant` (inline) makes it an Autopilot app. */
function fileToRequest(raw: Record<string, unknown>): AppRequest {
  const { assistant, ...rest } = raw as Record<string, unknown> & {
    assistant?: Record<string, unknown>;
  };
  const request = { ...rest } as AppRequest & { testCases?: unknown };
  // Test cases belong to applications:eval, not to the app.
  delete request.testCases;
  if (assistant) {
    request.type = "AUTOPILOT" as AppRequest["type"];
    request.intelligence = intelligenceFor(assistant);
  }
  // Never send a model key that sits in an assistant file; keys live in the vendor keys.
  const lm = (
    request.intelligence?.config as
      | { languageModel?: Record<string, unknown> }
      | undefined
  )?.languageModel;
  if (lm) delete lm.apiKey;
  return request;
}

/**
 * Applies command flags on top of `base` (the current app on update, `{}` on create).
 */
function applyFlags(base: AppRequest, flags: ApplicationFlags): AppRequest {
  const request: AppRequest = {
    ...base,
    speech: { ...(base.speech ?? {}) },
    listeners: [...(base.listeners ?? [])]
  };

  if (flags.name !== undefined) request.name = flags.name;
  if (flags.assistant) {
    const assistant = readConfigFile(flags.assistant);
    request.type = "AUTOPILOT" as AppRequest["type"];
    request.intelligence = fileToRequest({ assistant }).intelligence;
  }
  if (flags.url !== undefined) request.url = flags.url;
  if (flags.flavor !== undefined)
    request.flavor = flags.flavor as AppRequest["flavor"];

  const speech = request.speech!;
  if (flags.voice !== undefined) speech.voice = flags.voice;
  if (flags.language !== undefined) speech.language = flags.language;
  if (flags["stt-model"] !== undefined) speech.sttModel = flags["stt-model"];
  if (flags["tts-model"] !== undefined) speech.ttsModel = flags["tts-model"];
  if (flags["silence-timeout"] !== undefined)
    speech.silenceTimeoutMs = flags["silence-timeout"];
  if (flags.patience !== undefined)
    speech.patience = flags.patience as typeof speech.patience;

  if (flags["audio-codec"] !== undefined || flags["audio-rate"] !== undefined) {
    const codec = (flags["audio-codec"] ?? request.audio?.codec ?? "pcm16") as
      | "pcm16"
      | "pcmu";
    const rate =
      flags["audio-rate"] ??
      (codec === "pcmu" ? 8000 : (request.audio?.rate ?? 16000));
    request.audio = { codec, rate };
  }

  if (flags["fallback-app"] !== undefined)
    request.fallbackAppRef = flags["fallback-app"];
  if (flags["fallback-message"] !== undefined)
    request.fallbackMessage = flags["fallback-message"];

  if (flags["clear-listeners"]) request.listeners = [];
  if (flags.listener?.length) {
    request.listeners = [
      ...(request.listeners ?? []),
      ...flags.listener.map(parseListener)
    ];
  }
  if (flags.recording !== undefined)
    request.recording = flags.recording as AppRequest["recording"];

  if (flags.amd === false) request.amd = undefined;
  else if (flags.amd || flags["amd-window"] !== undefined) {
    const windowMs = flags["amd-window"] ?? request.amd?.windowMs;
    request.amd = windowMs ? { enabled: true, windowMs } : { enabled: true };
  }

  if (!request.type) request.type = "EXTERNAL" as AppRequest["type"];
  return request;
}

/** Throws the errors the control plane would, before a round trip. */
function checkRequest(request: AppRequest) {
  if (!request.name) throw new Error("a name is required (--name)");
  if (request.type === "AUTOPILOT") {
    if (!request.intelligence?.config)
      throw new Error("an Autopilot app needs an assistant (--assistant)");
    if (request.flavor && request.flavor !== "native")
      throw new Error("Autopilot apps use the native flavor");
  } else if (!request.url) {
    throw new Error("a url is required (--url ws:// or wss://)");
  }
}

export {
  AppRequest,
  ApplicationFlags,
  applicationToRequest,
  applyFlags,
  checkRequest,
  fileToRequest,
  parseListener,
  readConfigFile
};
