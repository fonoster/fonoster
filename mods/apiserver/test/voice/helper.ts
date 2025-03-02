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
import { Client } from "ari-client";
import { SinonSandbox } from "sinon";

function getAriStub(sandbox: SinonSandbox) {
  return {
    Channel: sandbox.stub().returns({
      originate: sandbox.stub(),
      on: sandbox.stub(),
      once: sandbox.stub(),
      hangup: sandbox.stub(),
      getChannelVar: sandbox.stub().resolves({ value: "value" })
    }),
    on: sandbox.stub(),
    once: sandbox.stub(),
    start: sandbox.stub(),
    removeListener: sandbox.stub(),
    channels: {
      get: sandbox.stub().resolves({
        getChannelVar: sandbox.stub().resolves({ value: "value" })
      }),
      ring: sandbox.stub(),
      ringStop: sandbox.stub(),
      record: sandbox.stub(),
      answer: sandbox.stub(),
      play: sandbox.stub(),
      hangup: sandbox.stub(),
      mute: sandbox.stub(),
      unmute: sandbox.stub(),
      sendDTMF: sandbox.stub(),
      snoopChannel: sandbox.stub()
    },
    playbacks: {
      control: sandbox.stub(),
      stop: sandbox.stub()
    },
    bridges: {
      get: sandbox.stub(),
      create: sandbox.stub().resolves({
        addChannel: sandbox.stub(),
        destroy: sandbox.stub()
      })
    }
  } as unknown as Client;
}

function getCreateVoiceClient(sandbox: SinonSandbox) {
  return sandbox.stub().returns({
    config: {
      sessionId: "channelId"
    },
    close: sandbox.stub(),
    sendResponse: sandbox.stub(),
    startSpeechGather: sandbox.stub(),
    startDtmfGather: sandbox.stub()
  });
}

export { getAriStub, getCreateVoiceClient };
