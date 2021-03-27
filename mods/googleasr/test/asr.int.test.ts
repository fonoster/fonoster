import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { join } from "path";
import GoogleASR from "../src/google_asr";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({ path: join(__dirname, "..", "..", ".env") });
}

describe("@fonos/googleasr", () => {
  afterEach(() => sandbox.restore());
  it.only("transcribes file from url", async () => {
    const config = {
      projectId: "clever-tube-275321",
      keyFilename:
        "/Users/pedrosanders/Projects/fonos/examples/google-tts/google_credentials.json"
    };
    const defaultAudioProfile = {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US"
    };

    const asr = new GoogleASR(config);
    const trascription = await asr.transcribe(
      " http://localhost:8080/audio.raw",
      defaultAudioProfile
    );
    console.log("trascription: ", trascription);
    expect(trascription).to.be.equals("how old is the Brooklyn Bridge");
  });
});
