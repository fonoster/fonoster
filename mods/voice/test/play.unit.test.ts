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
import PlayVerb from "../src/play/play";
import { VoiceRequest } from "../dist/types";
import VoiceEvents from "../src/events";
import { Verb } from "../src/verb";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

const voiceRequest:VoiceRequest = {
  accessKeyId: "603693c0afaa1a080000000c",
  signature: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmb25vcyIsInJv...",
  sessionId: "1622916892.122",
  dialbackEnpoint: "http://localhost:8088",
  number: "17853178070",
  callerId: "John Doe",
  callerNumber: "19103178070"
};

describe("@fonos/voice/play", () => {
  
  afterEach(() => sandbox.restore());

  it("play a sound on a remote media server", done => {
    sandbox.stub(Verb.prototype, "post").returns();
    const voiceEvents = new VoiceEvents()
    const play = new PlayVerb(voiceRequest, voiceEvents);
    play.run("sounds:hello-world", {})
    .then(event => {
      expect(event).to.be.deep.equal({ type: "PlaybackFinished", data: "1" });
      done();
    })
    .catch(e => done(e))

    setTimeout(()=> {
      voiceEvents.broadcast(JSON.stringify({type: "PlaybackFinished", data: "1"}))
    }, 500)
  });
});
