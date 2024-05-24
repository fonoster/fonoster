import { RecordingFinishedEvent } from "./ari";

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
type VoiceClientConfig = {
  accessKeyId: string;
  endpoint: string;
  appRef?: string;
  appUrl: string;
  appNumber: string;
  callerId: string;
  callerNumber: string;
  sessionId: string;
  sessionToken: string;
  metadata: Record<string, string>;
};

type Recording = RecordingFinishedEvent["recording"];

type VoiceCommand = {
  sessionId: string;
};

type AnswerCommand = {
  sessionId: string;
};

type VoiceClient = {
  config: VoiceClientConfig;
  recvAnswerCommand: (cmd: AnswerCommand) => Promise<void>;
  sendDtmfReceivedEvent: (digit: string) => void;
  sendPlaybackFinishedEvent: (playbackId: string) => void;
  sendRecordingFinishedEvent: (recording: Recording) => void;
  sendRecordingFailedEvent: (cause: string) => void;
  close: () => void;
};

export { VoiceClient, VoiceCommand, VoiceClientConfig };
