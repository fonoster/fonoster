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
type GatherStream = {
  stop: () => Promise<void>;
  onData: (
    cb: (payload: { speech: string; responseTime: number }) => void
  ) => void;
};

type Stream = {
  stop: () => Promise<void>;
  onData: (cb: (chunk: Uint8Array) => void) => void;
};

type TransferOptions = {
  timeout?: number;
  record?: boolean;
};

type Voice = {
  sessionRef: string;
  answer: () => Promise<void>;
  hangup: () => Promise<void>;
  say: (text: string) => Promise<void>;
  playDtmf: (dtmf: string) => Promise<void>;
  sgather: () => Promise<GatherStream>;
  transfer: (destination: string, options?: TransferOptions) => Promise<void>;
  stream: () => Promise<Stream>;
  stopSpeech: () => Promise<void>;
  stopStreams: () => Promise<void>;
};

export { TransferOptions, Voice };
