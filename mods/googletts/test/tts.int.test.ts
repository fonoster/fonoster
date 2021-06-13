import GoogleTTS from "../src/google_tts";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {join} from "path";
//import http from 'http'
//import fs from 'fs'
//import path from 'path'
//import textToSpeech from '@google-cloud/text-to-speech'
const {transcode} = require("@fonos/tts");

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({path: join(__dirname, "..", "..", ".env")});
}

describe("@fonos/googletts", () => {
  afterEach(() => sandbox.restore());

  /*it('rejects if the TTS because could not find default credentials', () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = void(0)
    const client = new textToSpeech.TextToSpeechClient()
    const join = sandbox.spy(path, 'join')
    const synthesizeSpeech = sandbox.spy(client, 'synthesizeSpeech')
    const writeFile = sandbox.spy(fs, 'writeFile')    
    const tts = new GoogleTTS()

    expect(tts.synthesize('hello world')).to.eventually.rejectedWith(
      'Could not load the default credentials.'
    )
    expect(join).to.have.been.calledTwice
    expect(writeFile).to.not.have.been.called
    expect(synthesizeSpeech).to.not.have.been.called
  })*/

  it("synthesizes text and returns path to file", async () => {
    const config = {
      projectId: "clever-tube-275321",
      keyFilename: "/Users/pedrosanders/Projects/fonos/credentials.json"
    };

    const tts = new GoogleTTS(config);
    await tts.synthetize("Hello Kayla, how are you doing today?", {
      ssmlGender: "FEMALE"
    });
    transcode(
      "/tmp/793891cb5510c196c4f487ad00c430fd.mp3",
      "/tmp/t_793891cb5510c196c4f487ad00c430fd.wav"
    );
  });
});
