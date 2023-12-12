import GoogleTTS from "../src/tts";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { join } from "path";
const { transcode } = require("@fonoster/tts");

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({ path: join(__dirname, "..", "..", ".env") });
}

describe("@fonoster/googletts", () => {
  afterEach(() => sandbox.restore());

  it("synthesizes text or ssml and returns path to the new file", async () => {
    const config = {
      projectId: "clever-tube-275321",
      keyFilename: "/Users/pedrosanders/Projects/fonoster/credentials.json"
    };

    const tts = new GoogleTTS(config);
    const result = await tts.synthesize(
      '<speak data-ui-hide-intent="true"> <par> <media xml:id=\'a\'> <speak><break time="2s" />Hello, thanks for calling! How can I help you? </speak> </media> <media xml:id=\'bg-loop\' end="speak.begin"> <audio soundLevel="-5dB" src="https://storage.googleapis.com/gablex-tts/persona/house/bg-loop-minimal.mp3"/> </media> <media xml:id="speak" begin="a.end-500ms"><audio soundLevel="+10dB" src="https://storage.googleapis.com/gablex-tts/persona/house/slang_notification_speak_now_08.wav"/></media> </par> </speak>',
      {
        ssmlGender: "FEMALE"
      }
    );

    expect(result).to.have.property("filename");
    expect(result).to.have.property("pathToFile");
  });
});
