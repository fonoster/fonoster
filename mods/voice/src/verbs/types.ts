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

const DATA = "data" as const;
const END = "end" as const;
const ERROR = "error" as const;

enum MuteDirection {
  IN = "IN",
  OUT = "OUT",
  BOTH = "BOTH"
}

type OnEvent = typeof DATA | typeof END | typeof ERROR;

// Alias for VoiceClientConfig
type VoiceRequest = VoiceClientConfig;

type VerbRequest = {
  sessionId: string;
};

type VerbResponse = {
  sessionId: string;
};

type PlayRequest = VerbRequest & { url: string };

type MuteRequest = VerbRequest & { direction: MuteDirection };

type UnmuteRequest = VerbRequest & { direction: MuteDirection };

// TODO: Enforce that one of the responses fields is present
type VoiceIn = {
  request?: VoiceRequest;
  answerResponse?: VerbResponse;
  hangupResponse?: VerbResponse;
  playResponse?: VerbResponse;
  muteResponse?: VerbResponse;
  unmuteResponse?: VerbResponse;
};

// TODO: Enforce that one of the requests fields is present
type VoiceOut = {
  answerRequest?: VerbRequest;
  hangupRequest?: VerbRequest;
  playRequest?: PlayRequest;
  muteRequest?: MuteRequest;
  unmuteRequest?: UnmuteRequest;
};

type VoiceSessionStream = {
  removeListener: (e: OnEvent, cb: (voice: VoiceIn) => void) => void;
  on: (e: OnEvent, cb: (voice: VoiceIn) => void) => void;
  write: (voice: VoiceOut) => void;
  end: () => void;
};

export {
  VoiceSessionStream,
  VoiceRequest,
  OnEvent,
  PlayRequest,
  VerbRequest,
  MuteRequest,
  UnmuteRequest,
  MuteDirection,
  DATA,
  END,
  ERROR
};
