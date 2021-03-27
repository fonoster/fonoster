import fs from "fs";
import util from "util";
import path from "path";
import textToSpeech from "@google-cloud/text-to-speech";
import { AbstractTTS, computeFilename } from "@fonos/tts";
import logger from "@fonos/logger";

type Voice = {
  name?: string;
  ssmlGender?: "MALE" | "FEMALE";
  naturalSampleRateHertz?: number;
  languageCodes?: string[];
};

/**
 * @classdesc Optional TTS engine for Fonos.
 *
 * @extends AbstractTTS
 * @example
 *
 * const GoogleTTS = require('@fonos/tts/googletts')
 * const Storage = require('@fonos/storage')
 * const { transcodeSync } = require('@fonos/tts/utils')

 *
 * // This is all done automatically when using the Say verb.
 * module.exports = chan => {
 *    const storage = new Storage()
 *    const tts = new GoogleTTS()
 *    const pathToFile = tts.synthesizeSync('Hello World')
 *    const pathToTranscodedFile = transcodeSync(pathToFile)
 *    const url = storage.uploadFileSync('hello-world.wav', pathToTranscodedFile)
 *    chan.play(url)
 * }
 */
class GoogleTTS extends AbstractTTS {
  config: { projectId: string; keyFilename: string };
  /**
   * Constructs a new GoogleTTS object.
   *
   * @see module:tts:AbstractTTS
   */
  constructor(config: { projectId: string; keyFilename: string }) {
    super("google-tts");
    this.config = config;
  }

  /**
   * @inherit
   */
  async synthesize(text: string, options: Voice = {}): Promise<string> {
    const client = new textToSpeech.TextToSpeechClient(this.config);
    const pathToFile = path.join("/tmp", computeFilename(text, options, "mp3"));

    logger.log(
      "debug",
      `@fonos/tts.GoogleTTS.synthesize [text: ${text}, options: ${JSON.stringify(
        options
      )}]`
    );

    const defaultVoice = { languageCode: "en-US", ssmlGender: "NEUTRAL" };
    const merge = require("deepmerge");
    const voice = merge(defaultVoice, options || {});

    const request = {
      input: { text },
      voice,
      audioConfig: { audioEncoding: "MP3" }
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request as any);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(pathToFile, response.audioContent, "binary");
    return pathToFile;
  }
}

export default GoogleTTS;
