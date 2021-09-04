/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Transform} from "stream";
import logger from "@fonos/logger";
import { GoogleSpeechConfig } from "./types";
const speech = require("@google-cloud/speech").v1p1beta1;

export default class StreamRecognize {
  speechClient: any;
  request: {config: GoogleSpeechConfig; interimResults: boolean};
  recognizeStream: any;
  restartCounter: number;
  audioInput: any[];
  lastAudioInput: any[];
  resultEndTime: number;
  isFinalEndTime: number;
  finalRequestEndTime: number;
  newStream: boolean;
  bridgingOffset: number;
  lastTranscriptWasFinal: boolean;
  streamingLimit: number;
  audioInputStreamTransform: any;
  transcriptCallback: any;
  resultsCallback: any;
  socket: any;
  cb: (stream: any) => void;
  constructor(config: GoogleSpeechConfig, socket, transcriptCallback, resultsCallback) {
    this.speechClient = new speech.SpeechClient(config);
    this.request = {
      config,
      interimResults: false
    };
    this.recognizeStream = null;
    this.restartCounter = 0;
    this.audioInput = [];
    this.lastAudioInput = [];
    this.resultEndTime = 0;
    this.isFinalEndTime = 0;
    this.finalRequestEndTime = 0;
    this.newStream = true;
    this.bridgingOffset = 0;
    this.lastTranscriptWasFinal = false;
    this.streamingLimit = 60000;

    this.audioInputStreamTransform = new Transform({
      transform: (chunk, encoding, callback) => {
        this.transformer(chunk, encoding, callback);
      }
    });

    this.transcriptCallback = transcriptCallback;
    this.resultsCallback = resultsCallback;
    this.startStream();
    this.socket = socket;
    // This connects the socket to the Stream Transform
    socket.pipe(this.audioInputStreamTransform);
  }

  startStream() {
    // Clear current audioInput
    this.audioInput = [];

    this.cb = (stream) => {
      if (this.newStream) {
        console.log("It will fail")
      }
      let results = this.speechCallback(stream);
      if (this.transcriptCallback && results[0] && results[0].alternatives[0]) {
        this.transcriptCallback(
          results[0].alternatives[0].transcript.trimStart(),
          results[0].isFinal
        );
      }

      if (this.resultsCallback) {
        this.resultsCallback(results);
      }
    };

    // Initiate (Reinitiate) a recognize stream
    this.recognizeStream = this.speechClient
      .streamingRecognize(this.request)
      .on("error", (err) => {
        if (err.code === 11) {
          // this.restartStream();
        } else {
          logger.error("API request error " + err);
        }
      })
      .on("data", this.cb);

    // Restart stream when streamingLimit expires
    setTimeout(() => {
      this.restartStream();
    }, this.streamingLimit);
  }

  speechCallback(stream) {
    this.resultEndTime =
      stream.results[0].resultEndTime.seconds * 1000 +
      Math.round(stream.results[0].resultEndTime.nanos / 1000000);

    if (stream.results[0].isFinal) {
      this.isFinalEndTime = this.resultEndTime;
      this.lastTranscriptWasFinal = true;
    } else {
      this.lastTranscriptWasFinal = false;
    }
    return stream.results;
  }

  /*
   * The transformer accumulates and keeps track
   * of the audio chunks to make sure we don't lose anything
   * when we restart the stream.
   */
  transformer(chunk, encoding, callback) {
    if (this.newStream && this.lastAudioInput.length !== 0) {
      // Approximate math to calculate time of chunks
      const chunkTime = this.streamingLimit / this.lastAudioInput.length;
      if (chunkTime !== 0) {
        if (this.bridgingOffset < 0) {
          this.bridgingOffset = 0;
        }
        if (this.bridgingOffset > this.finalRequestEndTime) {
          this.bridgingOffset = this.finalRequestEndTime;
        }
        const chunksFromMS = Math.floor(
          (this.finalRequestEndTime - this.bridgingOffset) / chunkTime
        );
        this.bridgingOffset = Math.floor(
          (this.lastAudioInput.length - chunksFromMS) * chunkTime
        );
        for (let i = chunksFromMS; i < this.lastAudioInput.length; i++) {
          this.recognizeStream.write(this.lastAudioInput[i]);
        }
      }
      this.newStream = false;
    }
    this.audioInput.push(chunk);

    if (this.recognizeStream) {
      this.recognizeStream.write(chunk);
    }

    callback();
  }

  restartStream() {
    if (this.recognizeStream) {
      this.recognizeStream.removeListener("data", this.cb);
      this.recognizeStream = null;
    }

    if (this.resultEndTime > 0) {
      this.finalRequestEndTime = this.isFinalEndTime;
    }
    this.resultEndTime = 0;
    this.lastAudioInput = [];
    this.lastAudioInput = this.audioInput;

    this.restartCounter++;

    logger.silly(
      `${this.streamingLimit * this.restartCounter}: RESTARTING REQUEST\n`
    );

    this.newStream = true;
    this.startStream();
  }
}
