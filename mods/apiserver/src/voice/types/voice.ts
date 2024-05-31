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
import { VoiceClientConfig, VoiceOut } from "@fonoster/common";

enum RequestType {
  ANSWER = "answerRequest",
  PLAY = "playRequest"
}

enum ResponseType {
  ANSWER = "answerResponse",
  PLAY = "playResponse"
}

type VoiceRequest = {
  sessionRef: string;
};

type VoiceResponse = {
  [key in ResponseType]?: Record<string, string> & { sessionRef: string };
};

type VoiceClient = {
  config: VoiceClientConfig;
  sendResponse: (command: VoiceOut) => void;
  on: (type: RequestType, callback: (data: VoiceRequest) => void) => void;
  connect: () => void;
  close: () => void;
};

export { VoiceClient, VoiceRequest, VoiceResponse, RequestType };
