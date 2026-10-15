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
// Mirrors schema/scenario.schema.json. The schema is the source of truth; these types only
// describe what the loader returns after validation.

export const SCENARIO_FORMAT = "fonoster.scenario.v1";

export type Contract =
  | "voice-session"
  | "twilio-media-streams-flavor"
  | "voice-sdk"
  | "media-control"
  | "autopilot"
  | "turn-taking";

export type Role = "app" | "gateway" | "media-control-client";

export type ProviderFailure =
  | "provider_unavailable"
  | "provider_timeout"
  | "bad_request";

export type ProviderBehavior = {
  delayMs?: number;
  failNext?: ProviderFailure;
  script?: Record<string, unknown>[];
};

export type Providers = {
  tts?: ProviderBehavior;
  stt?: ProviderBehavior;
  llm?: ProviderBehavior;
};

export type AudioSource = {
  ms?: number;
  kind?: "silence" | "tone" | "file";
  file?: string;
  track?: number;
  realtime?: boolean;
};

export type Setup = {
  call?: {
    direction?: "inbound" | "outbound";
    from?: string;
    to?: string;
    metadata?: Record<string, unknown>;
  };
  app?: {
    flavor?: "native" | "twilio";
    signingSecret?: string;
    verifySignature?: boolean;
    reachable?: boolean;
    fallback?: Record<string, unknown>;
    speech?: Record<string, unknown>;
  };
  providers?: Providers;
  callerAudio?: AudioSource;
  media?: {
    dialOutcome?: "answered" | "busy" | "no_answer" | "failed";
    appRef?: string;
    heartbeatMs?: number;
    /** media-control: whether the runner claims call.incoming (default true). */
    claimCalls?: boolean;
  };
  assistant?: Record<string, unknown>;
};

export type CallerAction = {
  dtmf?: string;
  hangup?: true;
  audio?: AudioSource;
  drop?: { reason: string; sipStatus?: number };
  nodeCrash?: true;
  /** media-control: a call arrives at the node, as an INVITE from Routr would. */
  call?: { from?: string; to?: string; appRef?: string; callRef?: string };
};

export type Timing = {
  within_ms?: number;
  budget_ms?: number;
  not_before_ms?: number;
  from?: string;
};

export type Step = Timing & {
  label?: string;
  capture?: Record<string, string>;
  send?: Record<string, unknown>;
  send_audio?: AudioSource;
  expect?: Record<string, unknown>;
  expect_none?: Record<string, unknown>;
  for_ms?: number;
  expect_audio?: { track?: number; ms?: unknown };
  expect_close?: { code?: number };
  wait?: { ms: number };
  inject?: Providers;
  assert?: Record<string, unknown>;
  close?: { code?: number; reason?: string };
  caller?: CallerAction;
  next?: true;
};

export type Scenario = {
  format: typeof SCENARIO_FORMAT;
  name: string;
  contract: Contract;
  role: Role;
  description?: string;
  spec?: string;
  fixture?: string;
  tags?: string[];
  skip?: string;
  ignore?: string[];
  setup?: Setup;
  steps: Step[];
  /** Absolute path of the file the scenario was loaded from (not part of the format). */
  file?: string;
};

export const STEP_ACTIONS = [
  "send",
  "send_audio",
  "expect",
  "expect_none",
  "expect_audio",
  "expect_close",
  "wait",
  "inject",
  "assert",
  "close",
  "caller"
] as const;

export type StepAction = (typeof STEP_ACTIONS)[number];

export function actionOf(step: Step): StepAction {
  const action = STEP_ACTIONS.find((a) => step[a] !== undefined);
  if (!action) {
    throw new Error(`step has no action: ${JSON.stringify(step)}`);
  }
  return action;
}
