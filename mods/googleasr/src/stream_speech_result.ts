import {StreamSpeechResult} from "@fonos/common";
import {Stream} from "stream";

export default class StreamSpeechImpl implements StreamSpeechResult {
  stream: Stream;
  constructor() {
    this.stream = new Stream();
  }

  close() {
    this.stream.removeAllListeners();
  }

  on(event: string, callback: Function) {
    if (event === "transcript") {
      this.stream.on("data", (data) => {
        callback(data);
      });
    }

    if (event === "error") {
      this.stream.on("error", (error: Error) => {
        callback(error);
      });
    }
  }

  emit(data: any) {
    this.stream.emit("data", data);
  }
}
