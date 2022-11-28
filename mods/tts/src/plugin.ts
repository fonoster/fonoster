import { SynthResult, TTSConfig, TTSPlugin } from "./types";
import { Plugin } from "@fonoster/common"
import { computeFilename } from "./utils";
import path from "path";
import fs from "fs";
import os from "os";

export default abstract class AbstractTTS extends Plugin implements TTSPlugin {
   config: TTSConfig;

   constructor(type: string, name: string, config: TTSConfig) {
    super(type, name);
    this.config = config;
    this.config.path = config.path ? config.path : os.tmpdir();
   }
  /**
   * @inherit
   * @deprecated
   */
  async synthetize?(text: string, options: any = {}): Promise<SynthResult> {
    return await this.synthesize(text, options);
  }

  /**
   * @inherit
   */
  async synthesize(text: string, options: any = {}): Promise<SynthResult> {
    const filename = computeFilename(text, options, "sln24");
    const pathToFile = path.join(this.config.path, filename);

    if (!fs.existsSync(pathToFile)) {
      return await this.synthesizeSpeech(text, options, filename, pathToFile);
    }
    return {filename, pathToFile}
  }

  abstract synthesizeSpeech(text: string, options: any, fileName: string, pathToFile: string): Promise<SynthResult>;

}