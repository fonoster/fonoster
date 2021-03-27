import Verb from "./verb";
import logger from "@fonos/logger";

interface PlayOptions {
  finishOnKey?: string;
}

const validate = (file: string, options: PlayOptions) => {
  const { finishOnKey = "#" } = options;
  if (!file) throw new Error("you must indicate a file.");
  if (
    finishOnKey &&
    (finishOnKey.length !== 1 || "1234567890#*".indexOf(finishOnKey) < 0)
  )
    throw new Error(
      `Invalid finishOnKey parameter: found ${finishOnKey} but must be a single digit type of 0-9,#,*`
    );
};

class Play extends Verb {
  constructor(channel: any, config: any) {
    super(channel, config);
  }

  run(file: string, options: PlayOptions = {}) {
    const { finishOnKey = "#" } = options;
    validate(file, options);
    logger.log(
      "debug",
      `@fonos/voice.Play [streaming file '${file}' from Media Server to endpoint]`
    );
    const result = this.channel.streamFile(file, finishOnKey);
    logger.log(
      "debug",
      `@fonos/voice.Play [rawReply from Media Server '${result.rawReply}'`
    );

    if (result.code === 200) {
      const res = parseInt(result.attributes.result);
      if (res > 1) {
        const charFromCode = String.fromCharCode(res);
        logger.log("debug", `@fonos/voice.Play [key pressed '${charFromCode}'`);
        return charFromCode;
      }
      if (res === 0) {
        logger.log("debug", `@fonos/voice.Play [key pressed ''`);
        return "";
      }
    }

    throw new Error(result.rawReply);
  }
}

export { Play as default, PlayOptions };
