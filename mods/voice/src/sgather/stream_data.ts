import {Stream} from "stream";
import {SGatherStream} from "./types";

export default class StreamData implements SGatherStream {
  stream: Stream;
  dtmfSubscribeToken: string;
  speechSubscribeToken: string;
  constructor() {
    this.stream = new Stream();
  }

  close() {
    if (this.dtmfSubscribeToken) {
      PubSub.unsubscribe(this.dtmfSubscribeToken);
    }
    if (this.speechSubscribeToken) {
      PubSub.unsubscribe(this.speechSubscribeToken);
    }

    this.stream.removeAllListeners();
  }

  on(event: string, callback: Function) {
    if (event === "transcript") {
      this.stream.on("transcript", (data) => {
        callback(data);
      });
    }

    if (event === "dtmf") {
      this.stream.on("dtmf", (key: string) => {
        callback(key);
      });
    }

    if (event === "error") {
      this.stream.on("error", (error: Error) => {
        callback(error);
      });
    }
  }

  emit(event: string, data: any) {
    this.stream.emit(event, data);
  }

  setDtmfSubscribeToken(token: string) {
    this.dtmfSubscribeToken = token;
  }

  setSpeechSubscribeToken(token: string) {
    this.speechSubscribeToken = token;
  }
}
