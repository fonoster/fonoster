import fs from "fs";
import util from "util";
import path from "path";
import textToSpeech from "@google-cloud/text-to-speech";
import {Plugin} from "@fonos/common";
import {TTSPlugin, computeFilename, SynthResult} from "@fonos/tts";
import logger from "@fonos/logger";
import {GoogleTTSConfig, Voice} from "./types";

const defaultVoice = {languageCode: "en-US", ssmlGender: "NEUTRAL"};

/**
 * @classdesc Optional TTS engine for Fonos.
 *
 * @extends AbstractTTS
 * @example
 * const GoogleTTS = require("@fonos/googletts");
 *
 * new GoogleTTS().synthetize("Hello world")
 *  .then((result) => console.log("path: " + result.pathToFile))
 *  .catch(console.err);
 */
class GoogleTTS extends Plugin implements TTSPlugin {
  config: GoogleTTSConfig;
  /**
   * Constructs a new GoogleTTS object.
   *
   * @see module:tts:AbstractTTS
   */
  constructor(config: GoogleTTSConfig) {
    super("google-tts");
    super.setType("tts");
    this.config = config;
    this.config.path ? this.config.path : "/tmp";
  }

  /**
   * @inherit
   */
  async synthetize(text: string, options: Voice = {}): Promise<SynthResult> {
    const client = new textToSpeech.TextToSpeechClient(this.config as any);
    // TODO: The file extension should be set based on the sample rate
    // For example, if we set the sample rate to 16K, then the extension needs to be
    // snl16, for 8K => sln, etc...
    const filename = computeFilename(text, options, "sln24");
    const pathToFile = path.join(this.config.path, filename);

    logger.log(
      "debug",
      `@fonos/tts.GoogleTTS.synthesize [text: ${text}, options: ${JSON.stringify(
        options
      )}]`
    );

    const merge = require("deepmerge");
    const voice = merge(defaultVoice, options || {});

    const request = {
      voice,
      input: {text},
      audioConfig: {audioEncoding: "LINEAR16"}
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request as any);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(pathToFile, response.audioContent, "binary");
    return {filename, pathToFile};
  }
}

export default GoogleTTS;
