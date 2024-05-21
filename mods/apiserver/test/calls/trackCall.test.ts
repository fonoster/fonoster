/* eslint-disable prettier/prettier */
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
import { status } from "@grpc/grpc-js";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { CallStatus } from "../../src/calls/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@calls/trackCall", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should track the status of a call", async function () {
    const { trackCall } = await import("../../src/calls/trackCall");
    const callRef = "5d8c253a-62a0-48d5-9c8f-cfd00279936f";

    const events = {
      on: sandbox.stub()
    };

    const call = {
      write: sandbox.stub(),
      end: sandbox.stub(),
      request: {
        ref: callRef
      }
    };
    const subs = { events };

    const trackCallHandler = trackCall(subs);

    trackCallHandler(call);

    events.on.callArgWith(1, { ref: callRef, status: CallStatus.RINGING });
    events.on.callArgWith(1, { ref: callRef, status: CallStatus.IN_PROGRESS });
    events.on.callArgWith(1, { ref: callRef, status: CallStatus.COMPLETED });

    expect(call.write).to.have.been.calledWith({ ref: callRef, status: CallStatus.QUEUED });
    expect(call.write).to.have.been.calledWith({ ref: callRef, status: CallStatus.RINGING });
    expect(call.write).to.have.been.calledWith({ ref: callRef, status: CallStatus.IN_PROGRESS });
    expect(call.write).to.have.been.calledWith({ ref: callRef, status: CallStatus.COMPLETED });
    expect(call.write).to.have.been.called.callCount(4)
    expect(call.end).to.have.been.calledOnce;
  });

  it("should handle error", async function () {
    const { trackCall } = await import("../../src/calls/trackCall");
    const callRef = "5d8c253a-62a0-48d5-9c8f-cfd00279936f";

    const events = {
      on: sandbox.stub()
    };

    const call = {
      write: sandbox.stub(),
      end: sandbox.stub(),
      request: {
        ref: callRef
      }
    };
    const subs = { events };

    const trackCallHandler = trackCall(subs);

    trackCallHandler(call);

    events.on.callArgWith(1, new Error("error"));

    expect(call.write).to.have.been.calledWith({ ref: callRef, status: CallStatus.QUEUED });
    expect(call.write).to.have.been.calledWith({ code: status.INTERNAL, message: "error" });
    expect(call.write).to.have.been.calledTwice;
    expect(call.end).to.have.been.calledOnce;
  });
});
