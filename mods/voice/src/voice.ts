/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
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
import AnswerVerb from "./answer/answer";
import HangupVerb from "./hangup/hangup";
import UnmuteVerb from "./unmute/unmute";
import GatherVerb, { GatherOptions } from "./gather/gather";
import MuteVerb, { MuteOptions } from "./mute/mute";
import PlayVerb, { PlayOptions } from "./play/play";
import RecordVerb, { RecordOptions, RecordResult } from "./record/record";
import { PlaybackControl } from "./playback/playback";
import { SayOptions } from "./say/types";
import { VoiceRequest } from "./types";
import { Plugin } from "@fonoster/common";
import { assertPluginExist } from "./asserts";
import PubSub from "pubsub-js";
import { Verb } from "./verb";
import { startMediaTransfer, stopMediaTransfer } from "./utils";
import SGatherVerb, { SGatherOptions } from "./sgather/gather";
import { SGatherStream } from "./sgather/types";
import { DtmfOptions } from "./dtmf/types";
import DtmfVerb from "./dtmf/dtmf";
import DialVerb from "./dial/dial";
import { DialOptions } from "./dial/types";
import StreamStatus from "./dial/status_stream";
import { VoiceTracer } from "./tracer";

/**
 * @classdesc Use the VoiceResponse object, to construct advance Interactive
 * Voice Response (IVR) applications.
 *
 * @extends Verb
 * @example
 *
 * import { VoiceServer } from "@fonoster/voice";
 *
 * async function handler (request, response) {
 *   await response.answer();
 *   await response.play("sound:hello-world");
 * }
 *
 * const voiceServer = new VoiceServer({base: '/voiceapp'})
 * voiceServer.listen(handler, { port: 3000 })
 */
export default class VoiceResponse {
  request: VoiceRequest;
  plugins: {};
  voiceTracer: VoiceTracer;

  /**
   * Constructs a new VoiceResponse object.
   *
   * @param {VoiceRequest} request - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(request: VoiceRequest, voiceTracer: VoiceTracer) {
    this.request = request;
    this.voiceTracer = voiceTracer;
    this.plugins = {};
  }

  /**
   * Adds a tts or asr plugin. Only one type of plugin can be attached.
   *
   * @param plugin
   * @see GoogleTTS
   * @see GoogleASR
   */
  use(plugin: Plugin): void {
    this.plugins[plugin.getType()] = plugin;
  }

  /**
   * Play an audio in the channel.
   *
   * @param {string} media - Sound name or uri with audio file
   * @param {PlayOptions} options - Optional parameters to alter the command's normal
   * behavior
   * @param {string} options.offset - Milliseconds to skip before playing. Only applies to the first URI if multiple media URIs are specified
   * @param {string} options.skip - Milliseconds to skip for forward/reverse operations
   * @param {string} options.playbackId - Playback identifier to use in Playback operations
   * @see Playback
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   await response.play("https://soundsserver:9000/sounds/hello-world.wav");
   * }
   */
  async play(media: string, options: PlayOptions = {}): Promise<void> {
    const span = this.voiceTracer.createSpan("play");
    await new PlayVerb(this.request).run(media, options);
    span.end();
  }

  /**
   * Converts a text into a sound and sends sound to media server. To use this verb, you must
   * first setup a TTS plugin such as MaryTTS, GoogleTTS, or AWS PollyTTS
   *
   * @param {string} text - Converts a text into a sound and sends sound to media server
   * @param {SayOptions} options - Optional parameters to alter the command's normal
   * behavior
   * @param {string} options.offset - Milliseconds to skip before playing
   * @param {string} options.skip - Milliseconds to skip for forward/reverse operations
   * @param {string} options.playbackId - Playback identifier to use in Playback operations
   * @see Play
   * @see Voice.use
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   response.use(new GoogleTTS())
   *   await response.say("Hello workd");   // Plays the sound using GoogleTTS's default values
   * }
   */
  async say(text: string, options: SayOptions = {}): Promise<void> {
    assertPluginExist(this, "tts");
    const tts = this.plugins["tts"];
    // It should return the filename and the generated file location
    const main = this.voiceTracer.createSpan("play");
    const span = this.voiceTracer.createSpan("synthesize");
    const result = await tts.synthesize(text, options);
    span.setAttribute("text", text);
    span.setAttribute("options", JSON.stringify(options));
    span.end();
    const media = `sound:${this.request.selfEndpoint}/tts/${result.filename}`;

    await new PlayVerb(this.request).run(media, options);
    main.setAttribute("media", media);
    main.setAttribute("options", JSON.stringify(options));
    main.end();
  }

  /**
   * Waits for data entry from the user's keypad or from a speech provider.
   *
   * @param {GatherOptions} options - Options to select the maximum number of digits, final character, and timeout
   * @param {number} options.numDigits - Milliseconds to skip before playing. Only applies to the first URI if multiple media URIs are specified
   * @param {number} options.timeout - Milliseconds to wait before timeout. Defaults to 4000. Use zero for no timeout.
   * @param {string} options.finishOnKey - Optional last character to wait for. Defaults to '#'. It will not be included in the returned digits
   * @param {string} options.source - Where to listen as input source. This option accepts `dtmf` and `speech`. A speech provider must be configure
   * when including the `speech` source. You might inclue both with `dtmf,speech`. Defaults to `dtmf`
   * @note When including `speech` the default timeout is 10000 (10s).
   * @see SpeechProvider
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   const digits = await response.gather({source: "dtmf,speech", numDigits: 3});
   *   console.log("digits: " + digits);
   * }
   */
  async gather(
    options: GatherOptions = { source: "speech,dtmf" }
  ): Promise<string> {
    let asr = null;
    if (options.source.includes("speech")) {
      assertPluginExist(this, "asr");
      asr = this.plugins["asr"];
    }
    const span = this.voiceTracer.createSpan("gather");
    const result = await new GatherVerb(this.request, asr).run(options);
    span.setAttribute("options", JSON.stringify(options));
    span.end();
    return result;
  }

  /**
   * Waits for data entry from the user's keypad or from a stream speech provider. This command is different from `gather`
   * in that it returns a stream of results instead of a single result. You can think of it as active listening.
   *
   * @param {SGatherOptions} options - Options object for the SGather verb
   * @param {string} options.source - Where to listen as input source. This option accepts `dtmf` and `speech`. A speech provider must be configure
   * when including the `speech` source. You might inclue both with `dtmf,speech`. Defaults to `speech,dtmf`
   * @return {SGatherStream} The SGatherStream fires events via the `on` method for `transcription`, `dtmf`, and `error`. And the stream can be close
   * with the `close` function.
   * @see StreamSpeechProvider
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   const stream = await response.sgather({source: "dtmf,speech"});
   *
   *   stream.on("transcript", (text, isFinal) => {
   *      console.log("transcript: %s", text);
   *   })
   *
   *   stream.on("dtmf", digit => {
   *      console.log("digit: " + digit);
   *      if (digit === "#") stream.close();
   *   })
   * }
   */
  async sgather(
    options: SGatherOptions = { source: "speech,dtmf" }
  ): Promise<SGatherStream> {
    let asr = null;
    if (options.source.includes("speech")) {
      assertPluginExist(this, "asr");
      asr = this.plugins["asr"];
    }
    return await new SGatherVerb(this.request, asr).run(options);
  }

  /**
   * Sends dtmf tones to the current session.
   *
   * @param {DtmfOptions} options - Options object for the Dtmf verb
   * @param {string} options.dtmf - A string of the dtmf tones
   * @example
   *
   * async function handler (request, response) {
   *    await response.answer();
   *    await response.play("sound:hello-world");
   *    await response.dtmf({dtmf: "1234"});
   * }
   */
  async dtmf(options: DtmfOptions): Promise<void> {
    const span = this.voiceTracer.createSpan("dtmf");
    const result = await new DtmfVerb(this.request).run(options);
    span.setAttribute("options", JSON.stringify(options));
    span.end();
    return result;
  }

  /**
   * Forwards the call to an Agent or the PSTN.
   *
   * @param {string} destination - Number or Agent to forward the call to
   * @param {DialOptions} options - Options object for the Dial verb
   * @param {timeout} options.timeout - Dial timeout
   * @return {StatusStream} The StatusStream fires events via the `on` method for `progress`, `answer`, `noanswer`, and `busy`. And the stream can be close
   * with the `close` function.
   * @example
   *
   * async function handler (request, response) {
   *    await response.answer();
   *    await response.say("dialing number");
   *    const stream = await response.dial("17853178070");
   *    stream.on("progress", console.log)
   *    stream.on("answer", console.log)
   *    stream.on("busy", console.log)
   * }
   */
  async dial(
    destination: string,
    options?: DialOptions
  ): Promise<StreamStatus> {
    const span = this.voiceTracer.createSpan("dial");
    const result = await new DialVerb(this.request).run(destination, options);
    span.setAttribute("destination", destination);
    span.setAttribute("options", JSON.stringify(options));
    span.end();
    return result;
  }

  /**
   * Returns a PlaybackControl control object.
   *
   * @param {string} playbackId - Playback identifier to use in Playback operations
   * @see Play
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   response.onDtmfReceived(async(digit) => {
   *      const control = response.playback("1234")
   *      digit === "3"
   *        ? await control.restart()
   *        : await control.forward()
   *   })
   *
   *   await response.play("https://soundsserver:9000/sounds/hello-world.wav", {
   *      playbackId: "1234"
   *   });
   * }
   */
  playback(playbackId: string): PlaybackControl {
    const span = this.voiceTracer.createSpan("playback");
    const result = new PlaybackControl(this.request, playbackId);
    span.setAttribute("playbackId", playbackId);
    span.end();
    return result;
  }

  /**
   * Listens event publication.
   *
   * @param {Function} handler - Event handler
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   response.on("DtmfReceived", async(digit) => {
   *      const control = response.playback("1234")
   *      digit === "3"
   *        ? await control.restart()
   *        : await control.forward()
   *   })
   *
   *   await response.play("https://soundsserver:9000/sounds/hello-world.wav", {
   *      playbackId: "1234"
   *   });
   * }
   */
  async on(topic: string, handler: Function) {
    PubSub.subscribe(`${topic}.${this.request.sessionId}`, (type, data) => {
      handler(data);
    });
  }

  /**
   * Mutes a channel.
   *
   * @param {MuteOptions} options - Indicate which direction of he communication to mute
   * @param {string} options.direction - Possible values are 'in', 'out', and 'both'
   * @see unmute
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   await response.mute();       // Will mute both directions
   * }
   */
  async mute(options?: MuteOptions): Promise<void> {
    const span = this.voiceTracer.createSpan("mute");
    const result = new MuteVerb(this.request).run(options);
    span.setAttribute("options", JSON.stringify(options));
    span.end();
    await result;
  }

  /**
   * Unmutes a channel.
   *
   * @param {MuteOptions} options - Indicate which direction of he communication to unmute
   * @param {string} options.direction - Possible values are 'in', 'out', and 'both'
   * @see mute
   * @example
   *
   * async function handler (request, response) {
   *   ...
   *   await response.unmute({direction: "out"});       // Will unmute only the "out" direction
   * }
   */
  async unmute(options?: MuteOptions): Promise<void> {
    const span = this.voiceTracer.createSpan("unmute");
    const result = new UnmuteVerb(this.request).run(options);
    span.setAttribute("options", JSON.stringify(options));
    span.end();
    await result;
  }

  /**
   * Answer the communication channel. Before running any other verb you
   * must run the anwer command.
   *
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   ...
   * }
   */
  async answer(): Promise<void> {
    const span = this.voiceTracer.createSpan("answer");
    const result = new AnswerVerb(this.request).run();
    span.end();
    await result;
  }

  /**
   * Terminates the communication channel.
   *
   * @example
   *
   * async function handler (request, response) {
   *   ...
   *   await response.hangup();
   * }
   */
  async hangup(): Promise<void> {
    const span = this.voiceTracer.createSpan("hangup");
    const result = new HangupVerb(this.request).run();
    span.end();
    // Need to close or the span will be lost
    this.voiceTracer.close();
    await result;
  }

  /**
   * Records the current channel and uploads the file to the storage subsystem.
   *
   * @param {RecordOptions} options - optional parameters to alter the command's normal
   * behavior
   * @param {number} options.maxDuration - Maximum duration of the recording, in seconds. Use `0` for no limit
   * @param {number} options.maxSilence - Maximum duration of silence, in seconds. Use `0` for no limit
   * @param {boolean} options.beep - Play beep when recording begins
   * @param {string} options.finishOnKey - DTMF input to terminate recording
   * @return {Promise<RecordResult>} Returns useful information such as the duration of the recording, etc.
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();;
   *   const result = await response.record({finishOnKey: "#"});
   *   console.log("recording result: " + JSON.stringify(result))     // recording result: { duration: 30 ...}
   * }
   */
  async record(options: RecordOptions): Promise<RecordResult> {
    const span = this.voiceTracer.createSpan("record");
    const result = await new RecordVerb(this.request).run(options);
    span.end();
    return result;
  }

  // Requests media from Media server
  async openMediaPipe() {
    const span = this.voiceTracer.createSpan("openMediaPipe");
    const genericVerb = new Verb(this.request);
    await startMediaTransfer(genericVerb, this.request.sessionId);
    span.end();
  }

  // Requests media stop from Media server
  async closeMediaPipe() {
    const span = this.voiceTracer.createSpan("stopMediaTransfer");
    const genericVerb = new Verb(this.request);
    await stopMediaTransfer(genericVerb, this.request.sessionId);
    span.end();
  }
}
