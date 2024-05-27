/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { VoiceClientConfig } from "@fonoster/common";
import { VoiceResponse } from "./VoiceResponse";

const DATA = "data" as const;
const END = "end" as const;
const ERROR = "error" as const;

type OnEvent = typeof DATA | typeof END | typeof ERROR;

// Alias for VoiceClientConfig
type VoiceRequest = VoiceClientConfig;

type VoiceHandler = (req: VoiceRequest, res: VoiceResponse) => Promise<void>;

type AnswerRequest = {
  sessionId: string;
};

type AnswerResponse = {
  sessionId: string;
};

type HangupRequest = {
  sessionId: string;
};

type HangupResponse = {
  sessionId: string;
};

type PlayRequest = {
  sessionId: string;
  url: string;
};

type PlayResponse = {
  playbackId: string;
};

// TODO: Enforce that one of the responses fields is present
type VoiceIn = {
  request?: VoiceRequest;
  answerResponse?: AnswerResponse;
  hangupResponse?: HangupResponse;
  playResponse?: PlayResponse;
};

// TODO: Enforce that one of the requests fields is present
type VoiceOut = {
  answerRequest?: AnswerRequest;
  hangupRequest?: HangupRequest;
  playRequest?: PlayRequest;
};

type VoiceSessionStream = {
  removeListener: (e: OnEvent, cb: (voice: VoiceIn) => void) => void;
  on: (e: OnEvent, cb: (voice: VoiceIn) => void) => void;
  write: (voice: VoiceOut) => void;
  end: () => void;
};

type ServerConfig = {
  bind?: string;
  port?: number;
};

export {
  VoiceHandler,
  VoiceSessionStream,
  VoiceRequest,
  ServerConfig,
  OnEvent,
  DATA,
  END,
  ERROR
};
