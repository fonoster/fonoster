/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { APIClient } from "@fonoster/common";
import Monitor, { MonitorPB } from "../src/client/monitor";
import { Level } from "../src/service/level";
import { EventType } from "../src/service/event_type";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/monitor", () => {
  const eventObj = new MonitorPB.Event();
  eventObj.setRef("Nx05y-ldZa");
  eventObj.setMessage("Test message");
  eventObj.setLevel(Level.fromString("warn"));
  eventObj.setEventType(EventType.fromString("app"));
  eventObj.setTimestamp(new Date().toISOString());
  eventObj.setBody(Struct.fromJavaScript({ test: "test" }));

  afterEach(() => sandbox.restore());

  it("should list events", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        searchEvents: () => {
          return {
            sendMessage: () => Promise.resolve([eventObj])
          };
        }
      });

    const request = {
      query: {}
    };

    const monitorAPI = new Monitor();
    const result = await monitorAPI.searchEvents(request);

    expect(serviceStub).to.be.calledTwice;
    expect(result).to.have.property("nextPageToken").to.be.equal(null);
    expect(result.events[0])
      .to.have.property("ref")
      .to.be.equal(eventObj.getRef());
    expect(result.events[0])
      .to.have.property("message")
      .to.be.equal(eventObj.getMessage());
    expect(result.events[0])
      .to.have.property("level")
      .to.be.equal(Level.toString(eventObj.getLevel()));
    expect(result.events[0])
      .to.have.property("eventType")
      .to.be.equal(EventType.toString(eventObj.getEventType()));
    expect(result.events[0]).to.have.property("timestamp").to.be.not.null;
  });

  it("convert type to string", async () => {
    expect(Level.fromString("info")).to.be.equal(0);
    expect(Level.fromString("warn")).to.be.equal(1);
    expect(Level.fromString("error")).to.be.equal(2);
    expect(Level.fromString("verbose")).to.be.equal(3);
    expect(EventType.fromString("app")).to.be.equal(0);
    expect(EventType.fromString("sip")).to.be.equal(1);
    expect(EventType.fromString("call")).to.be.equal(2);

    expect(Level.toString(0)).to.be.equal("info");
    expect(Level.toString(1)).to.be.equal("warn");
    expect(Level.toString(2)).to.be.equal("error");
    expect(Level.toString(3)).to.be.equal("verbose");
    expect(EventType.toString(0)).to.be.equal("app");
    expect(EventType.toString(1)).to.be.equal("sip");
    expect(EventType.toString(2)).to.be.equal("call");
  });
});
