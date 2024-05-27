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
import { VoiceRequest } from "../src";

const sessionId = "00000000-0000-0000-0000-000000000000";

const voiceRequest: VoiceRequest = {
  appRef: "3861b08b-1602-45e4-b523-dc3036ba85e7",
  sessionId,
  accessKeyId: "WO00000000000000000000000000000000",
  endpoint: "localhost:50061",
  ingressNumber: "+1234567890",
  callerId: "John Doe",
  callerNumber: "+14345551234",
  sessionToken: "jwt-token",
  metadata: {}
};

function getVoiceObject(sandbox: SinonSandbox) {
  const onStub = sandbox.stub().callsFake((_, cb) => {
    cb();
  });

  return {
    removeListener: sandbox.stub(),
    on: onStub,
    write: sandbox.stub(),
    end: sandbox.stub()
  };
}

export { sessionId, voiceRequest, getVoiceObject };
