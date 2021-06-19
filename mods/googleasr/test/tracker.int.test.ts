import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {GoogleSpeechTracker} from "../src/tracker";
import {GoogleSpeechConfig} from "../src/types";
import recorder from "node-record-lpcm16";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

const speechConfig: GoogleSpeechConfig = {
  languageCode: "en-US"
};

describe("@fonos/googleasr", () => {
  afterEach(() => sandbox.restore());
  it.only("returns a speech result for a given stream", async () => {
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
    expect(result).to.have.property("transcription").not.to.be.null;
  });
});
