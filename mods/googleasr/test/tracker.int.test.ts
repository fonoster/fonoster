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
import { GoogleSpeechTracker } from "../src/tracker";
import { GoogleSpeechConfig } from "../src/types";
import recorder from "node-record-lpcm16";
import logger from "../../dispatcher/node_modules/@fonoster/logger/src";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

const speechConfig: GoogleSpeechConfig = {
  keyFilename: "/Users/pedrosanders/Projects/voice/google.json",
  languageCode: "en-US"
};

describe("@fonoster/googleasr", () => {
  afterEach(() => sandbox.restore());
  it("returns a speech result for a given stream", async () => {
    logger.info("Begin to talk now");
    const speechTracker = new GoogleSpeechTracker(speechConfig);
    const recorderStream = recorder
      .record({
        sampleRateHertz: 16000,
        threshold: 0,
        verbose: false,
        recordProgram: "rec", // Try also "arecord" or "sox"
        silence: "10.0"
      })
      .stream();

    const result = await speechTracker.transcribe(recorderStream);
    logger.info(
      `The transcript result is: ${JSON.stringify(result.transcript)}`
    );
    expect(result).to.have.property("transcript").not.to.be.null;
  });

  it("returns a speech result for a given stream", (done) => {
    logger.info("Begin to talk now");
    const speechTracker = new GoogleSpeechTracker(speechConfig);
    const recorderStream = recorder
      .record({
        sampleRateHertz: 16000,
        threshold: 0,
        verbose: false,
        recordProgram: "rec", // Try also "arecord" or "sox"
        silence: "10.0"
      })
      .stream();

    const stream = speechTracker.streamTranscribe(recorderStream);

    stream.on("transcript", (result) => {
      logger.verbose(
        `The transcript result is: ${JSON.stringify(result.transcript)}`
      );
      expect(result).to.have.property("transcript").not.to.be.null;
      if (result.text === "close") {
        stream.close();
        done();
      }
    });
  });
});
