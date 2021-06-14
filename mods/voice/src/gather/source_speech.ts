import stream from "stream";
import PubSub from "pubsub-js";
import { GatherOptions } from "./types";
import { objectToQString } from "../utils";
import GoogleASR, { GoogleSpeechConfig } from "@fonos/googleasr";

const speechConfig: GoogleSpeechConfig = {
  config: {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
    languageCode: "en-US"
  },
  interimResults: false
};

const speechProvider = new GoogleASR(speechConfig);

const waitForSpeech =
  async (sessionId: string, options: GatherOptions, verb): Promise<string> =>
    new Promise(async (resolve, reject) => {
      const speechTracker = speechProvider.createSpeechTracker();
      let token = null;
      const readable = new stream.Readable({
        // The read logic is omitted since the data is pushed to the socket
        // outside of the script's control. However, the read() function 
        // must be defined.
        read() { }
      });

      token = PubSub.subscribe(`media.${sessionId}`, (type, data) => {
        readable.push(data);
      })

      speechTracker.transcribe(readable)
        .then(result => {
          resolve(result.transcription);
          PubSub.unsubscribe(token);
          // TODO: Also tell Media Server to stop sending media
        }).catch(e => {
          reject(e)
          PubSub.unsubscribe(token);
        })

      await verb.post(
        `events/user/SendExternalMedia`,
        objectToQString({
          // WARNING: Harcoded value
          application: "mediacontroller"
        }))
    });

export default waitForSpeech;