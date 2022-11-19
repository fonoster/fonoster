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
import GoogleTTS from "../src/tts";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import textToSpeech from "@google-cloud/text-to-speech";
import fs from "fs";
import path from "path";
import { isSSML } from "../src/utils";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();
const sandbox = sinon.createSandbox();

describe("@fonoster/googletts", () => {
  afterEach(() => sandbox.restore());

  it.skip("rejects if the TTS because could not find any credentials", async () => {
    const client = new textToSpeech.TextToSpeechClient();
    const join = sandbox.spy(path, "join");
    const synthesizeSpeech = sandbox.spy(client, "synthesizeSpeech");
    const writeFile = sandbox.spy(fs, "writeFile");
    const tts = new GoogleTTS({
      projectId: "",
      keyFilename: ""
    });

    await expect(tts.synthesize("hello world")).to.be.eventually.rejectedWith(
      "Could not load the default credentials."
    );
    expect(join).to.have.been.called;
    expect(writeFile).to.not.have.been.called;
    expect(synthesizeSpeech).to.not.have.been.called;
  });

  it("synthesizes text and returns path to file", async () => {
    const synthesizeSpeechStub = sandbox
      .stub(textToSpeech.TextToSpeechClient.prototype, "synthesizeSpeech")
      .resolves([{ audioContent: "some-audio" }]);
    const writeFile = sandbox.spy(fs, "writeFile");
    const join = sandbox.spy(path, "join");
    const config = {
      projectId: "project-id",
      keyFilename: "path-to-file"
    };

    const tts = new GoogleTTS(config);
    const result = await tts.synthesize(
      "Hello Kayla, how are you doing today?",
      {
        ssmlGender: "FEMALE"
      }
    );

    expect(join).to.have.been.calledOnce;
    expect(writeFile).to.have.been.calledOnce;
    expect(synthesizeSpeechStub).to.have.been.calledOnce;
    expect(result).to.have.property("filename").to.not.be.null;
    expect(result).to.have.property("pathToFile").to.not.be.null;
  });

  it("checks if input is ssml", async () => {
    const input1 =
      '<speak data-ui-hide-intent="true"> <par> <media xml:id=\'a\'> <speak><break time="2s" />Hello, thanks for calling! How can I help you? </speak> </media> <media xml:id=\'bg-loop\' end="speak.begin"> <audio soundLevel="-5dB" src="https://storage.googleapis.com/gablex-tts/persona/house/bg-loop-minimal.mp3"/> </media> <media xml:id="speak" begin="a.end-500ms"><audio soundLevel="+10dB" src="https://storage.googleapis.com/gablex-tts/persona/house/slang_notification_speak_now_08.wav"/></media> </par> </speak>';
    const input2 = '<speak data-ui-hide-intent="true">...</speak> ';

    expect(isSSML("<speak>Hi there</speak>")).to.be.true;
    expect(isSSML(input1)).to.be.true;
    expect(isSSML(input2)).to.be.true;
    expect(isSSML("Hi there")).to.be.false;
  });
});
