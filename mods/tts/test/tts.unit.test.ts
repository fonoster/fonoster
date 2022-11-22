import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { join } from "path";
import { computeFilename, optionsToQueryString, transcode } from "../src/utils";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({ path: join(__dirname, "..", "..", ".env") });
}

describe("@fonoster/tts/utils", () => {
  afterEach(() => sandbox.restore());

  it("converts a json object into a query string", () => {
    const options = {
      voice: "peter",
      language: "spanish"
    };
    const q = optionsToQueryString(options);
    expect(q).to.be.equal("voice=peter&language=spanish");
  });

  it("will compute the filename base on given parameters", () => {
    const t = computeFilename("Hello World", {
      voice: "Anna",
      speed: 0.1,
      language: "en",
      cachingFields: ["voice", "speed"]
    });
    expect(t).to.be.equal("940c2687367636c07be34668c6d8299f.wav");
  });

  it.skip("converts a given audio into an audio works on asterisk", async () => {
    const sox = require("sox-audio");
    const run = sandbox.spy(sox.prototype, "run");
    const on = sandbox.stub(sox.prototype, "on");
    on.withArgs("end").yields({});
    //on.withArgs('error').yields(error);

    const result = await transcode(
      __dirname + "/../etc/test.wav",
      __dirname + "/../etc/test_transcoded.wav"
    );

    expect(run).to.have.been.calledOnce;
    expect(on).to.have.been.calledTwice;
    expect(result).to.contain("/../etc/test_transcoded.wav");
  });

  it.skip("rejects promise if transcoding fails", () => {
    const sox = require("sox-audio");
    sandbox.spy(sox.prototype, "run");
    sandbox.spy(sox.prototype, "input");

    const on = sandbox.stub(sox.prototype, "on");
    const error = { message: "nop" };

    on.withArgs("end").yields({});
    on.withArgs("error").yields(error);

    expect(
      transcode(
        __dirname + "/../etc/test.wav",
        __dirname + "/../etc/test_transcoded.wav"
      )
    ).to.eventually.be.rejectedWith("Cannot process audio");
  });
});
