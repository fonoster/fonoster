/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import VoiceEvents from "../src/events";
import GatherVerb, {GatherOptions} from "../src/gather/gather";
import {Verb} from "../src/verb";
import {VoiceRequest} from "../dist/types";
import {
  assertsFinishOnKeyIsChar,
  assertsHasNumDigitsOrTimeout,
  assertsValuesArePositive
} from "../src/gather/asserts";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

const voiceRequest: VoiceRequest = {
  accessKeyId: "603693c0afaa1a080000000c",
  signature: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmb25vcyIsInJv...",
  sessionId: "1622916892.122",
  dialbackEnpoint: "http://localhost:8088",
  number: "17853178070",
  callerId: "John Doe",
  callerNumber: "19103178070"
};

describe("@fonos/voice/gather", () => {
  afterEach(() => sandbox.restore());

  it("waits for dtmf send from phone", (done) => {
    sandbox.stub(Verb.prototype, "post").returns();
    const voiceEvents = new VoiceEvents();
    const gather = new GatherVerb(voiceRequest, voiceEvents);

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
      voiceEvents.broadcast(JSON.stringify({type: "DtmfReceived", data: "1"}));
      voiceEvents.broadcast(JSON.stringify({type: "DtmfReceived", data: "2"}));
      voiceEvents.broadcast(JSON.stringify({type: "DtmfReceived", data: "2"}));
    }, 1000);
  });

  it("resolves when receives a finishOnChar", (done) => {
    sandbox.stub(Verb.prototype, "post").returns();
    const voiceEvents = new VoiceEvents();
    const gather = new GatherVerb(voiceRequest, voiceEvents);

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
      voiceEvents.broadcast(JSON.stringify({type: "DtmfReceived", data: "1"}));
      voiceEvents.broadcast(JSON.stringify({type: "DtmfReceived", data: "2"}));
      voiceEvents.broadcast(JSON.stringify({type: "DtmfReceived", data: "#"}));
    }, 500);
  });

  it("only returns digits before timeout", (done) => {
    sandbox.stub(Verb.prototype, "post").returns();
    const voiceEvents = new VoiceEvents();
    const gather = new GatherVerb(voiceRequest, voiceEvents);

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
      voiceEvents.broadcast(JSON.stringify({type: "DtmfReceived", data: "1"}));
      voiceEvents.broadcast(JSON.stringify({type: "DtmfReceived", data: "2"}));
      // Here we simulate taking a long time to send the last digit
    }, 200);
  });

  context("assert functions", () => {
    it("asserts that options has either a numDigits or a timeout back stop", () => {
      expect(() => assertsHasNumDigitsOrTimeout({numDigits: 3})).to.not.throw;
      expect(() => assertsHasNumDigitsOrTimeout({})).to.throw(
        "you must provide either 'numDigits' or 'timeout' option"
      );
    });

    it("ensures that numDigits and timeout are both positive numbers", () => {
      expect(() => assertsValuesArePositive({numDigits: 0})).to.throw(
        "the option 'numDigits' must be a number greater than zero"
      );
      expect(() => assertsValuesArePositive({numDigits: -1})).to.throw(
        "the option 'numDigits' must be a number greater than zero"
      );
      expect(() => assertsValuesArePositive({timeout: 0})).to.not.throw;
      expect(() => assertsValuesArePositive({timeout: -1})).to.throw(
        "the option 'timeout' must be a number equal or greater than zero"
      );
      expect(() => assertsValuesArePositive({timeout: 0, numDigits: 10})).to.not
        .throw;
    });

    it("finish on key is on the keypad", () => {
      expect(() => assertsFinishOnKeyIsChar({finishOnKey: "-1"})).to.throw(
        "the option 'finishOnKey' must be a single char [0-9], *, or #"
      );
      expect(() => assertsFinishOnKeyIsChar({finishOnKey: "01"})).to.throw(
        "the option 'finishOnKey' must be a single char [0-9], *, or #"
      );
      expect(() => assertsFinishOnKeyIsChar({finishOnKey: "0"})).to.not.throw;
    });
  });
});
