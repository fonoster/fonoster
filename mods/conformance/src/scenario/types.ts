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
import { NodeOverrides } from "../roomr/nodeConfig";

// Mirrors schema/scenario.schema.json. The schema is the source of truth; these types only
// describe what the loader returns after validation.

export const SCENARIO_FORMAT = "fonoster.scenario.v1";

export type Contract =
  | "voice-session"
  | "twilio-media-streams-flavor"
  | "voice-sdk"
  | "media-control"
  | "autopilot"
  | "turn-taking"
  | "regions"
  | "billing";

export type Role =
  "app" | "appbridge" | "media-control-client" | "region-cell" | "platform";

export type ProviderFailure =
  "provider_unavailable" | "provider_timeout" | "bad_request";

export type ProviderBehavior = {
  delayMs?: number;
  failNext?: ProviderFailure;
  script?: Record<string, unknown>[];
  /** LLM only: leave out the usage report, as a vendor that reports no usage would. */
  omitUsage?: boolean;
};

export type Providers = {
  tts?: ProviderBehavior;
  stt?: ProviderBehavior;
  llm?: ProviderBehavior;
};

export type AudioSource = {
  ms?: number;
  kind?: "silence" | "tone" | "file";
  /** media-control: the tone's frequency (each party its own, for the mix-minus checker). */
  hz?: number;
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
    /** The callRef the Roomr node gives the call (Twilio's callSid). */
    callRef?: string;
  };
  app?: {
    protocol?: "fonoster" | "twilio";
    signingSecret?: string;
    verifySignature?: boolean;
    reachable?: boolean;
    /** The secret the fake app verifies with, when it is not the one AppBridge signs with. */
    verifySecret?: string;
    /** `{app: "app-2"}` (the harness's second app) or `{message}`. */
    fallback?: { app?: string; message?: string };
    speech?: Record<string, unknown>;
    /** Audio filters AppBridge applies to caller audio (`conformance-mute` silences it, `conformance-boom` fails mid-call). */
    filters?: { name: string; options?: Record<string, unknown> }[];
    /** The app's workspace (Twilio's accountSid). */
    workspaceRef?: string;
  };
  /** A listen-only socket on the harness's second app; `peer` says which socket the runner plays. */
  listener?: {
    tracks?: "inbound" | "outbound" | "both";
    peer?: "app" | "listener";
  };
  providers?: Providers;
  callerAudio?: AudioSource;
  media?: {
    dialOutcome?: "answered" | "busy" | "no_answer" | "failed";
    appRef?: string;
    heartbeatMs?: number;
    /** The Go node's room limit (RealMediaHarness). */
    maxRooms?: number;
  };
  agent?: Record<string, unknown>;
  /** media-control: the Roomr node(s) under test and the fakes around them. */
  roomr?: RoomrSetup;
  /** voice-session: the catalog AppBridge resolves ids with (see SCENARIOS.md). */
  catalog?: {
    voices?: {
      id: string;
      state?: "active" | "deprecated" | "retired";
      replacement?: string;
    }[];
  };
};

export type CallerAction = {
  dtmf?: string;
  hangup?: true;
  audio?: AudioSource;
  drop?: { reason: string; sipStatus?: number };
  nodeCrash?: true;
  /**
   * media-control: a call arrives at a node as an INVITE (appRef and callRef become X-App-Ref
   * and X-Call-Ref; `headers` are added as given; `codecs` is the offer).
   */
  call?: {
    from?: string;
    to?: string;
    appRef?: string;
    callRef?: string;
    name?: string;
    node?: number;
    headers?: Record<string, string>;
    codecs?: string[];
  };
  /** media-control: which caller call the action applies to (default the last placed). */
  name?: string;
  /** media-control: the caller sends no RTP at all (true) or resumes (false). */
  mute?: boolean;
};

/** media-control: the node(s), their config overrides and the fakes' initial behaviour. */
export type RoomrSetup = {
  /** How many nodes (default 1). */
  nodes?: number;
  /** Config overrides for every node (short timeouts and limits, headers, registrations). */
  config?: NodeOverrides;
  /** Per-node overrides, by index. */
  node_config?: NodeOverrides[];
  app?: AppAction;
  trunk?: TrunkAction;
  /** The fake registrar requires these credentials. */
  registrar?: { username: string; password: string };
};

/** `rpc` steps: the fake controller calls one Roomr RPC (or places a call across the nodes). */
export type RpcAction = {
  method: string;
  node?: number;
  request?: Record<string, unknown>;
  /** The RPC must succeed and its reply match this pattern. */
  reply?: Record<string, unknown>;
  /** The RPC must fail and `{ code, reason, message }` match this pattern. */
  error?: Record<string, unknown>;
  /** `place` only: the node order to try instead of the heartbeat scoring. */
  order?: number[];
};

/** `app` steps: the fake session endpoint (the app side of the control streams). */
export type AppAction = {
  mode?: "answer" | "reject" | "stall" | "down";
  sip_status?: number;
  answer_after_ms?: number;
  max_duration_s?: number;
  /** The stream to act on (default the last opened). */
  call_ref?: string;
  /** Answer (or Ready) a stalled stream now. */
  answer?: true;
  /** One AppMessage on the stream, in snake_case (`{ hold: { music } }`). */
  send?: Record<string, unknown>;
  /** The app leg plays a tone (or silence). */
  audio?: AudioSource;
  /** The app leg sends no RTP at all (true) or resumes (false). */
  mute?: boolean;
  /** Every stream breaks and the endpoint stops listening. */
  kill?: true;
};

/** `trunk` steps: how the fake trunk answers what a node dials. */
export type TrunkAction = {
  mode?: "answer" | "busy" | "no_answer" | "unavailable" | "decline";
  after_ms?: number;
  auth?: { username: string; password: string };
  challenge?: number;
};

/** `nats` steps: fault injection between the nodes and NATS. */
export type NatsAction = {
  drop?: "connection" | "messages";
  /** `drop: messages` only: the subject prefix dropped (default `roomr.`). */
  prefix?: string;
  restore?: true;
};

/** `node` steps: the node process itself. */
export type NodeAction = { index?: number; kill?: true; sigterm?: true };

/** `rtp` steps: one of the harness's RTP parties (rtp_a .. rtp_d) plays or goes silent. */
export type RtpAction = { name: string; audio?: AudioSource; mute?: boolean };

/** `control` steps: the harness acts on the implementation's management side (regions). */
export type ControlAction = { op: string } & Record<string, unknown>;

/**
 * `stripe` steps (billing): the harness sets the Stripe fake's state and failures through its
 * control API. Against a Stripe sandbox, a runner applies what Stripe's test mode supports.
 */
export type StripeAction = {
  /** The outcome of the account's next payment. */
  next_payment?: "succeed" | "decline" | "requires_action" | "timeout";
  /** Moves the test clock (and billing's clock) this many days ahead. */
  advance_days?: number;
  /** The next N webhook deliveries fail with 500. */
  fail_webhooks?: number;
  /** Stripe reports a meter event error (v1.billing.meter.error_report_triggered). */
  meter_error_report?: true;
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
  control?: ControlAction;
  stripe?: StripeAction;
  rpc?: RpcAction;
  app?: AppAction;
  trunk?: TrunkAction;
  nats?: NatsAction;
  node?: NodeAction;
  rtp?: RtpAction;
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
  "caller",
  "control",
  "stripe",
  "rpc",
  "app",
  "trunk",
  "nats",
  "node",
  "rtp"
] as const;

export type StepAction = (typeof STEP_ACTIONS)[number];

export function actionOf(step: Step): StepAction {
  const action = STEP_ACTIONS.find((a) => step[a] !== undefined);
  if (!action) {
    throw new Error(`step has no action: ${JSON.stringify(step)}`);
  }
  return action;
}
