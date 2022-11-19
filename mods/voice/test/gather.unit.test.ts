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
import GatherVerb from "../src/gather/gather";
import { Verb } from "../src/verb";
import { assertsHasNumDigitsOrTimeout } from "../src/gather/asserts";
import { voiceRequest } from "./voice_request";
import PubSub from "pubsub-js";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/voice/gather", () => {
  afterEach(() => sandbox.restore());

  it.skip("waits for dtmf send from phone", (done) => {
    sandbox.stub(Verb.prototype, "post").returns();
    const gather = new GatherVerb(voiceRequest);

    gather
      .run({
        numDigits: 3
      })
      .then((digits) => {
        expect(digits).to.be.deep.equal("122");
        done();
      })
      .catch((e) => done(e));

    setTimeout(() => {
      PubSub.publish("DtmfReceived", { type: "DtmfReceived", data: "1" });
      PubSub.publish("DtmfReceived", { type: "DtmfReceived", data: "2" });
      PubSub.publish("DtmfReceived", { type: "DtmfReceived", data: "2" });
    }, 1000);
  });

  it.skip("resolves when receives a finishOnChar", (done) => {
    sandbox.stub(Verb.prototype, "post").returns();
    const gather = new GatherVerb(voiceRequest);

    gather
      .run({
        numDigits: 3,
        finishOnKey: "#"
      })
      .then((digits) => {
        expect(digits).to.be.deep.equal("12");
        done();
      })
      .catch((e) => done(e));

    setTimeout(() => {
      PubSub.publish("DtmfReceived", { type: "DtmfReceived", data: "1" });
      PubSub.publish("DtmfReceived", { type: "DtmfReceived", data: "2" });
      PubSub.publish("DtmfReceived", { type: "DtmfReceived", data: "#" });
    }, 500);
  });

  it.skip("only returns digits before timeout", (done) => {
    sandbox.stub(Verb.prototype, "post").returns();
    const gather = new GatherVerb(voiceRequest);

    gather
      .run({
        numDigits: 3,
        timeout: 400
      })
      .then((digits) => {
        expect(digits).to.be.deep.equal("12");
        done();
      })
      .catch((e) => done(e));

    setTimeout(() => {
      PubSub.publish("DtmfReceived", { type: "DtmfReceived", data: "1" });
      PubSub.publish("DtmfReceived", { type: "DtmfReceived", data: "2" });
      // Here we simulate taking a long time to send the last digit
    }, 200);
  });

  context("assert functions", () => {
    it.skip("asserts that options has either a numDigits or a timeout back stop", () => {
      expect(() => assertsHasNumDigitsOrTimeout({ numDigits: 3 })).to.not.throw;
      expect(() => assertsHasNumDigitsOrTimeout({})).to.throw(
        "you must provide either 'numDigits' or 'timeout' option"
      );
    });
  });
});
