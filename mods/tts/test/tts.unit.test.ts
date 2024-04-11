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
    expect(t).to.be.equal("b7af8f1ae248e5d662086ff47ebe244f.wav");
  });
});
