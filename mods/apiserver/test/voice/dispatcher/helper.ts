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
import { SinonSandbox } from "sinon";

function getAriStub(sandbox: SinonSandbox) {
  return {
    on: sandbox.stub(),
    start: sandbox.stub(),
    channels: {
      answer: sandbox.stub(),
      play: sandbox.stub(),
      hangup: sandbox.stub(),
      mute: sandbox.stub(),
      unmute: sandbox.stub()
    }
  };
}

function getCreateVoiceClient(sandbox: SinonSandbox) {
  return sandbox.stub().returns({
    config: {
      sessionId: "channelId"
    },
    close: sandbox.stub(),
    sendResponse: sandbox.stub()
  });
}

export { getAriStub, getCreateVoiceClient };
