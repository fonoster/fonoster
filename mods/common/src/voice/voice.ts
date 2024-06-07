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
import { DialRequest, DialStatus } from "./Dial";
import { GatherRequest, GatherResponse } from "./Gather";
import { MuteRequest } from "./Mute";
import { PlayRequest, PlayResponse } from "./Play";
import { PlayDtmfRequest } from "./PlayDtmf";
import { RecordRequest, RecordResponse } from "./Record";
import { SayRequest, SayResponse } from "./Say";
import {
  StartStreamRequest,
  StartStreamResponse,
  StopStreamRequest,
  StreamPayload
} from "./Stream";
import { StreamGatherRequest } from "./StreamGather";
import { VerbRequest, VerbResponse, VoiceRequest } from "./Verb";

const DATA = "data" as const;
const END = "end" as const;
const ERROR = "error" as const;

enum StreamEvent {
  DATA = "data",
  END = "end",
  ERROR = "error"
}

enum StreamContent {
  ANSWER_REQUEST = "answerRequest",
  ANSWER_RESPONSE = "answerResponse",
  HANGUP_REQUEST = "hangupRequest",
  HANGUP_RESPONSE = "hangupResponse",
  PLAY_REQUEST = "playRequest",
  PLAY_RESPONSE = "playResponse",
  PLAY_DTMF_REQUEST = "playDtmfRequest",
  PLAY_DTMF_RESPONSE = "playDtmfResponse",
  PLAYBACK_CONTROL_REQUEST = "playbackControlRequest",
  PLAYBACK_CONTROL_RESPONSE = "playbackControlResponse",
  MUTE_REQUEST = "muteRequest",
  MUTE_RESPONSE = "muteResponse",
  UNMUTE_REQUEST = "unmuteRequest",
  UNMUTE_RESPONSE = "unmuteResponse",
  GATHER_REQUEST = "gatherRequest",
  GATHER_RESPONSE = "gatherResponse",
  STREAM_GATHER_REQUEST = "streamGatherRequest",
  STREAM_GATHER_RESPONSE = "streamGatherResponse",
  SAY_REQUEST = "sayRequest",
  SAY_RESPONSE = "sayResponse",
  RECORD_REQUEST = "recordRequest",
  RECORD_RESPONSE = "recordResponse",
  DIAL_REQUEST = "dialRequest",
  DIAL_RESPONSE = "dialResponse",
  START_STREAM_REQUEST = "startStreamRequest",
  START_STREAM_RESPONSE = "startStreamResponse",
  STOP_STREAM_REQUEST = "stopStreamRequest",
  STREAM_PAYLOAD = "streamPayload"
}

type VoiceClientConfig = {
  appRef: string;
  accessKeyId: string;
  endpoint: string;
  ingressNumber: string;
  callerName: string;
  callerNumber: string;
  sessionRef: string;
  sessionToken: string;
  ttsOptions: Record<string, unknown>;
  metadata?: Record<string, string>;
};

// TODO: Enforce that one of the responses fields is present
type VoiceIn = {
  request?: VoiceRequest;
  content?: StreamContent;
  answerResponse?: VerbResponse;
  hangupResponse?: VerbResponse;
  playResponse?: PlayResponse;
  playDtmfResponse?: VerbResponse;
  playbackControlResponse?: VerbResponse;
  muteResponse?: VerbResponse;
  unmuteResponse?: VerbResponse;
  gatherResponse?: GatherResponse;
  streamGatherResponse?: GatherResponse;
  sayResponse?: SayResponse;
  recordResponse?: RecordResponse;
  dialResponse?: { status: DialStatus };
  startStreamResponse?: StartStreamResponse;
  streamPayload?: StreamPayload;
};

// TODO: Enforce that one of the requests fields is present
type VoiceOut = {
  answerRequest?: VerbRequest;
  hangupRequest?: VerbRequest;
  playRequest?: PlayRequest;
  playDtmfRequest?: PlayDtmfRequest;
  playbackControlRequest?: VerbRequest;
  muteRequest?: MuteRequest;
  unmuteRequest?: MuteRequest;
  gatherRequest?: GatherRequest;
  streamGatherRequest?: StreamGatherRequest;
  sayRequest?: SayRequest;
  recordRequest?: RecordRequest;
  dialRequest?: DialRequest;
  startStreamRequest?: StartStreamRequest;
  stopStreamRequest?: StopStreamRequest;
  streamPayload?: StreamPayload;
};

type BaseVoiceStream<T, W> = {
  removeListener: (e: StreamEvent, cb: (voice: T) => void) => void;
  on: (e: StreamEvent, cb: (voice: T) => void) => void;
  write: (voice: W) => void;
  end: () => void;
};

type VoiceSessionStreamServer = BaseVoiceStream<VoiceIn, VoiceOut>;
type VoiceSessionStreamClient = BaseVoiceStream<VoiceOut, VoiceIn>;

export {
  VoiceClientConfig,
  VoiceSessionStreamServer,
  VoiceSessionStreamClient,
  StreamEvent,
  StreamContent,
  VoiceIn,
  VoiceOut,
  DATA,
  END,
  ERROR
};
