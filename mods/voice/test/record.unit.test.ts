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
import { Verb } from "../src/verb";
import RecordVerb from "../src/record/record";
import { voiceRequest } from "./voice_request";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();
import PubSub from "pubsub-js";

describe("@fonoster/voice/record", () => {
  afterEach(() => sandbox.restore());

  it.skip("records a channel and uploads the file to the storage subsystem", (done) => {
    sandbox.stub(Verb.prototype, "post").returns();
    const record = new RecordVerb(voiceRequest);
    record
      .run()
      .then((event) => {
        expect(event).to.be.deep.equal({ duration: 30 });
        done();
      })
      .catch((e) => done(e));

    setTimeout(() => {
      PubSub.publish("RecordingFinished", {
        type: "RecordingFinished",
        data: { duration: 30 }
      });
    }, 500);
  });
});
