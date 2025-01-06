/*
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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { NatsConnection } from "nats";
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { getAriStub } from "./helper";
import { AriEvent } from "../../src/voice/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/handler/VoiceDispatcher", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a VoiceDispatcher", async function () {
    // Arrange
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
    const ari = getAriStub(sandbox);
    const nc = {} as unknown as NatsConnection;
    const createVoiceClient = sandbox.stub();
    const voiceDispatcher = new VoiceDispatcher(ari, nc, createVoiceClient);

    // Act
    voiceDispatcher.start();

    // Assert
    expect(ari.on).to.have.been.called.calledThrice;
    expect(ari.on).to.have.been.calledWith(
      AriEvent.STASIS_START,
      match.func.and(
        match(function (fn) {
          return fn.name === "bound handleStasisStart";
        })
      )
    );
    expect(ari.on).to.have.been.calledWith(
      AriEvent.STASIS_END,
      match.func.and(
        match(function (fn) {
          return fn.name === "bound handleStasisEnd";
        })
      )
    );
  });
});
