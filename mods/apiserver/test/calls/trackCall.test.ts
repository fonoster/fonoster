/* eslint-disable prettier/prettier */
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
import { DialStatus } from "@fonoster/common";
import * as chai from "chai"; import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { NatsConnection } from "nats";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@calls/trackCall", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should track the status of a call", async function () {
    const { createTrackCall } = await import("../../src/calls/createTrackCall");
    const callRef = "5d8c253a-62a0-48d5-9c8f-cfd00279936f";

    const call = {
      write: sandbox.stub(),
      end: sandbox.stub(),
      request: {
        ref: callRef
      }
    };

    const subscription = { callback: sandbox.stub() };
    const nc = { subscribe: sandbox.stub().returns(subscription) } as unknown as NatsConnection;

    const trackCall = createTrackCall(nc);

    trackCall(call, () => {});

    const msg = {
      json: sandbox.stub().onFirstCall().returns({ ref: callRef, status: DialStatus.TRYING })
        .onSecondCall().returns({ ref: callRef, status: DialStatus.PROGRESS })
        .onThirdCall().returns({ ref: callRef, status: DialStatus.ANSWER })
    };

    subscription.callback(null, msg);
    subscription.callback(null, msg);
    subscription.callback(null, msg);

    expect(call.write).to.have.been.calledWith({ ref: callRef, status: DialStatus.TRYING });
    expect(call.write).to.have.been.calledWith({ ref: callRef, status: DialStatus.PROGRESS });
    expect(call.write).to.have.been.calledWith({ ref: callRef, status: DialStatus.ANSWER });
  });

});
