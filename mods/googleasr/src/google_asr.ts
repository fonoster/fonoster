import axios from "axios";
import path from "path";
import fs from "fs";
import speech from "@google-cloud/speech";

// The sampleRateHertz field is optional for FLAC and WAV files where the
// sample rate is included in the file header.
const defaultAudioProfile = {
  encoding: "LINEAR16",
  languageCode: "en-US"
};

class GoogleASR {
  config: {projectId: string; keyFilename: string};
  /**
   * Constructs a new GoogleASR client object.
   */
  constructor(config: {projectId: string; keyFilename: string}) {
    this.config = config;
  }

  // Perhaps we should move this to an util file
  async downloadFile(url: string, name: string) {
    const p = path.resolve(__dirname, "/tmp", name);
    const writer = fs.createWriteStream(p);

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }

  async transcribe(
    url: string,
    audioProfile: any = defaultAudioProfile
  ): Promise<string> {
    const objectid = require("objectid");
    const client = new speech.SpeechClient(this.config);
    const filename = "" + objectid();

    await this.downloadFile(url, filename);

    const pathToFile = path.resolve(__dirname, "/tmp", filename);
    const file = fs.readFileSync(pathToFile);

    const request = {
      audio: {
        content: file.toString("base64")
      },
      config: audioProfile
    };

    // Detects speech in the audio file
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map((result: any) => result.alternatives[0].transcript)
      .join("\n");
    return transcription;
  }

  transcribeSync(url: string, audioProfile: any = defaultAudioProfile) {
    const sleep = require("sync").sleep;
    let result;
    let error;
    this.transcribe(url, audioProfile)
      .then((r) => (result = r))
      .catch((e) => (error = e));

    while (result === undefined && error === undefined) sleep(100);

    if (error) throw error;

    return result;
  }
}

export default GoogleASR;
