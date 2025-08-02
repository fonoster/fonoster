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
import {
  DialRecordDirection,
  StreamGatherSource,
  StreamPayload
} from "@fonoster/common";
import { VoiceResponse } from "@fonoster/voice";
import { v4 as uuidv4 } from "uuid";
import { Voice } from "./types";

class VoiceImpl implements Voice {
  private readonly playbackRef: string;
  sessionRef: string;
  sgatherStream: {
    stop: () => Promise<void>;
    onData: (
      cb: (payload: { speech: string; responseTime: number }) => void
    ) => void;
  };
  vadStream: {
    stop: () => Promise<void>;
    onData: (cb: (chunk: Uint8Array) => void) => void;
  };

  constructor(
    sessionRef: string,
    private readonly voice: VoiceResponse
  ) {
    this.sessionRef = sessionRef;
    this.playbackRef = uuidv4();
  }

  async answer() {
    await this.voice.answer();
  }

  async hangup() {
    await this.voice.hangup();
  }

  async say(text: string) {
    await this.voice.say(text, { playbackRef: this.playbackRef });
  }

  async playDtmf(dtmf: string) {
    await this.voice.playDtmf(dtmf);
  }

  async sgather() {
    const stream = await this.voice.sgather({
      source: StreamGatherSource.SPEECH
    });

    this.sgatherStream = {
      stop: async () => {
        stream.close();
        stream.cleanup(() => {});
      },
      onData: (
        cb: (payload: { speech: string; responseTime: number }) => void
      ) => {
        stream.onPayload(
          (payload: { speech?: string; responseTime: number }) => {
            cb({
              speech: payload.speech!,
              responseTime: payload.responseTime
            });
          }
        );
      }
    };

    return this.sgatherStream;
  }

  async stream() {
    const stream = await this.voice.stream();

    this.vadStream = {
      stop: async () => {
        stream.close();
        stream.cleanup(() => {});
      },
      onData: (cb: (chunk: Uint8Array) => void) => {
        stream.onPayload((payload: StreamPayload) => {
          cb(payload.data!);
        });
      }
    };

    return this.vadStream;
  }

  async transfer(to: string, options: { record: boolean; timeout: number }) {
    const { record, timeout } = options;

    const effectiveOptions = {
      recordDirection: record ? DialRecordDirection.BOTH : undefined,
      timeout
    };

    await this.voice.dial(to, effectiveOptions);
  }

  async stopSpeech() {
    await this.voice.stopSay();
  }

  async stopStreams() {
    await this.vadStream.stop();
    await this.sgatherStream.stop();
  }
}

export { VoiceImpl };
