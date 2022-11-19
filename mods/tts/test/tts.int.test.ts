import { transcode } from "../src/utils";
import path from "path";

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
}

describe("TTS Utils", () => {
  it("converts a given audio into an audio works on asterisk", async () => {
    return transcode(
      __dirname + "/../etc/test.wav",
      __dirname + "/../etc/test_transcoded.wav"
    );
  });
});
