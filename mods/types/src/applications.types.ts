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
import { BaseApiObject, ListRequest, ListResponse } from "./common";
import { Flatten } from "./utils";

enum ApplicationType {
  EXTERNAL = "EXTERNAL",
  AUTOPILOT = "AUTOPILOT"
}

enum ExpectedTextType {
  EXACT = "EXACT",
  SIMILAR = "SIMILAR"
}

/** Speech defaults of a session app; voices and models are catalog ids. */
type SpeechDefaults = {
  voice?: string;
  language?: string;
  sttModel?: string;
  ttsModel?: string;
  silenceTimeoutMs?: number;
  patience?: "low" | "normal" | "high";
};

type AudioFormat = { codec: "pcm16" | "pcmu"; rate: number };

type AppListener = { url: string; tracks?: "inbound" | "outbound" | "both" };

type RecordingPolicy = "off" | "on" | "consent";

/** The session app model (voice-session G2). */
type SessionAppFields = {
  /** ws:// or wss:// URL the gateway dials (Autopilot apps: the hosted Autopilot). */
  url?: string;
  flavor?: "native" | "twilio";
  speech?: SpeechDefaults;
  audio?: AudioFormat;
  fallbackAppRef?: string;
  fallbackMessage?: string;
  listeners?: AppListener[];
  /** Empty inherits the workspace's policy. */
  recording?: RecordingPolicy | "";
};

type Application = SessionAppFields & {
  ref: string;
  name: string;
  type: ApplicationType;
  /** The last characters of the signing secret; the secret itself is never read back. */
  signingSecretHint?: string;
  endpoint?: string;
  textToSpeech?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  speechToText?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  intelligence?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
};

type CreateApplicationRequest = SessionAppFields & {
  name: string;
  type: ApplicationType;
  endpoint?: string;
  textToSpeech?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  speechToText?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  /** Autopilot apps: the assistant (sessionAssistantSchema); productRef is derived from its model. */
  intelligence?: {
    productRef?: string;
    credentials?: Record<string, unknown>;
    config: Record<string, unknown>;
  };
};

type UpdateApplicationRequest = Flatten<
  BaseApiObject & Partial<CreateApplicationRequest>
>;

type ListApplicationsRequest = ListRequest;

type CreateApplicationResponse = {
  ref: string;
  /** Shown only here and on rotation. */
  signingSecret?: string;
  signingSecretHint?: string;
};

type RotateSigningSecretResponse = {
  ref: string;
  signingSecret: string;
  signingSecretHint: string;
};

type ListApplicationsResponse = ListResponse<Application>;

type EvaluateIntelligenceRequest = {
  intelligence: {
    productRef: string;
    config: Record<string, unknown>;
  };
};

/** Streaming event: one step result for a scenario */
type StepEvaluationResultEvent = {
  type: "stepResult";
  scenarioRef: string;
  stepResult: StepEvaluationReport;
};

/** Streaming event: scenario completed summary */
type ScenarioSummaryEvent = {
  type: "scenarioSummary";
  scenarioRef: string;
  overallPassed: boolean;
};

/** Streaming event: eval error */
type EvalErrorEvent = {
  type: "evalError";
  message: string;
};

/** Single event in the EvaluateIntelligence server stream */
type EvaluateIntelligenceEvent =
  | StepEvaluationResultEvent
  | ScenarioSummaryEvent
  | EvalErrorEvent;

type ScenarioEvaluationReport = {
  scenarioRef: string;
  overallPassed: boolean;
  steps: StepEvaluationReport[];
};

type StepEvaluationReport = {
  humanInput: string;
  expectedResponse: string;
  aiResponse: string;
  evaluationType: ExpectedTextType;
  passed: boolean;
  errorMessage?: string;
  toolEvaluations?: ToolEvaluationReport[];
};

type ToolEvaluationReport = {
  expectedTool: string;
  actualTool: string;
  passed: boolean;
  expectedParameters?: Record<string, unknown>;
  actualParameters?: Record<string, unknown>;
  errorMessage?: string;
};

type CreateTestTokenResponse = {
  domain: string;
  displayName: string;
  signalingServer: string;
  targetAor: string;
  username: string;
  token: string;
};

export {
  AppListener,
  AudioFormat,
  CreateApplicationResponse,
  RecordingPolicy,
  RotateSigningSecretResponse,
  SessionAppFields,
  SpeechDefaults,
  Application,
  ApplicationType,
  CreateApplicationRequest,
  CreateTestTokenResponse,
  ListApplicationsRequest,
  ListApplicationsResponse,
  UpdateApplicationRequest,
  EvaluateIntelligenceRequest,
  EvaluateIntelligenceEvent,
  ScenarioEvaluationReport,
  StepEvaluationReport,
  ToolEvaluationReport,
  ExpectedTextType
};
