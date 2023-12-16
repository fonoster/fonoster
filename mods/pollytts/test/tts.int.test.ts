import PollyTTS, { Voice } from "../src/tts";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/pollytts", () => {
  afterEach(() => sandbox.restore());
  it("synthesizes text and returns path to file", async () => {
    const config = {
      region: "us-east-1",
      keyFilename: __dirname + "/../etc/credentials.json"
    };
    const tts = new PollyTTS(config);
    await tts.synthesize("Hello Kayla, how are you doing today?", {
      voice: Voice.Bianca
    });

    // TODO: Verify using fs.existSync that a new file was created
    // See your /tmp and ensure that a new .sln16 file was created
  });
});
