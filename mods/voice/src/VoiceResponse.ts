/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import {
  DialOptions,
  GatherOptions,
  GatherResponse,
  GatherSource,
  MuteDirection,
  MuteOptions,
  PlaybackControlAction,
  PlayOptions,
  PlayResponse,
  RecordOptions,
  RecordResponse,
  SayOptions,
  StreamEvent,
  StreamGatherOptions,
  StreamOptions,
  VerbResponse,
  VoiceRequest,
  VoiceSessionStreamServer
} from "@fonoster/common";
import { struct } from "pb-util";
import {
  Answer,
  Dial,
  DialStatusStream,
  Gather,
  Hangup,
  Mute,
  Play,
  PlaybackControl,
  PlayDtmf,
  Record,
  Say,
  StartStream,
  StartStreamGather,
  StopSay,
  StopStream,
  StopStreamGather,
  Stream,
  StreamGatherStream,
  Unmute
} from "./verbs";

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
 *   await response.play("https://soundsserver:9000/sounds/hello-world.wav");
 * }
 *
 * new VoiceServer().listen(handler, { port: 3000 })
 */
class VoiceResponse {
  voice: VoiceSessionStreamServer;
  request: VoiceRequest;

  /**
   * Constructs a new VoiceResponse object.
   *
   * @param {VoiceRequest} request - Options to indicate the objects endpoint
   * @param {VoiceSessionStream} voice - The voice session stream
   * @see module:core:APIClient
   */
  constructor(request: VoiceRequest, voice: VoiceSessionStreamServer) {
    this.voice = voice;
    this.request = request;
  }

  /**
   * Answer the call. Before running any other verb you
   * must run the answer command.
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   * }
   */
  async answer(): Promise<VerbResponse> {
    await new Answer(this.request, this.voice).run();

    return { sessionRef: this.request.sessionRef };
  }

  /**
   * Hangup the call.
   * @example
   *
   * async function handler (request, response) {
   *  await response.hangup();
   * }
   */
  async hangup(): Promise<VerbResponse> {
    await new Hangup(this.request, this.voice).run();

    return { sessionRef: this.request.sessionRef };
  }

  /**
   * Play an audio in the call.
   *
   * @param {string} url - The URL of the media to play
   * @param {PlayOptions} options - Options to control the playback
   * @param {string} options.playbackRef - Playback identifier to use in Playback operations
   * @see Playback
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   await response.play("https://soundsserver:9000/sounds/hello-world.wav");
   * }
   */
  async play(url: string, options?: PlayOptions): Promise<PlayResponse> {
    const response = await new Play(this.request, this.voice).run({
      ...options,
      sessionRef: this.request.sessionRef,
      url
    });

    return response.playResponse;
  }

  /**
   * Play a series of DTMF digits in a call.
   *
   * @param {string} digits -The DTMF digits to play (0-9, #, or *)
   * @example
   *
   * async function handler (request, response) {
   *  await response.answer();
   *  await response.playDtmf("1234");
   * }
   */
  async playDtmf(digits: string): Promise<void> {
    await new PlayDtmf(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      digits
    });
  }

  /**
   * Control the playback of the currently playing media.
   *
   * @param {string} playbackRef - The playback identifier
   * @param {PlaybackControlAction} action - The action to perform (STOP, RESTART, PAUSE, UNPAUSE, FORWARD)
   * @see play
   * @example
   *
   * async function handler (request, response) {
   *    await response.answer();
   *    await response.play("https://s3.fonoster.io/uuid/hello-world.wav", { playbackRef: "playback-01" });
   *
   *    // Pause the media
   *    await response.playbackControl("playback-01", PlaybackControlAction.PAUSE);
   * }
   */
  async playbackControl(
    playbackRef: string,
    action: PlaybackControlAction
  ): Promise<VerbResponse> {
    await new PlaybackControl(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      playbackRef,
      action
    });

    return { sessionRef: this.request.sessionRef };
  }

  /**
   * Waits for data entry from the user's keypad or from a speech provider.
   *
   * @param {GatherOptions} options - Options to select the maximum number of digits, final character, and timeout
   * @param {number} options.maxDigits - Maximum number of digits to collect. Defaults to 1
   * @param {number} options.timeout - Milliseconds to wait before timeout. Defaults to 4000. Use zero for no timeout.
   * @param {string} options.finishOnKey - Optional last character to wait for. Defaults to '#'. It will not be included in the returned digits
   * @param {GatherSource} options.source - Where to listen as input source. This option accepts `DTMF` and `SPEECH`. A speech provider must be configure
   * when including the `SPEECH` source. You might include both with `SPEECH_AND_DTMF`. Defaults to `SPEECH_AND_DTMF`
   * @note When including `SPEECH` the default timeout is 10000 (10s).
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   const speech = await response.gather({ source: GatherSource.SPEECH, numDigits: 3 });
   *   console.log("speech: " + speech);
   *   await response.hangup();
   * }
   */
  async gather(
    options: GatherOptions = { source: GatherSource.SPEECH_AND_DTMF }
  ): Promise<GatherResponse> {
    const response = await new Gather(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      ...options
    });

    return response.gatherResponse;
  }

  /**
   * Send a text for a TTS engine to convert to speech.
   *
   * @param {string} text - The text to convert to speech
   * @param {SayOptions} options - Options to control the TTS engine
   * @param {string} options.playbackRef - Playback identifier to use in Playback operations
   * @param {TTSOptions} options.ttsOptions - Options to control the TTS engine (specific to the TTS engine)
   * @see Say
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   const playbackRef = await response.say("Hello World");
   *
   *   // Like the play verb, you can control the playback
   *   await response.playbackControl(playbackRef, PlaybackControlAction.STOP);
   * }
   */
  async say(text: string, options?: SayOptions): Promise<VerbResponse> {
    await new Say(this.request, this.voice).run({
      options: options ? struct.encode(options) : undefined,
      sessionRef: this.request.sessionRef,
      text
    });

    return { sessionRef: this.request.sessionRef };
  }

  /**
   * Stop the current TTS operation.
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *
   *   // Some async operation
   *   setTimeout(() => {
   *     // Will stop the current TTS operation
   *     response.stopSay();
   *   }, 1000);
   *
   *   await response.say("Long text to say...");
   * }
   */
  async stopSay(): Promise<VerbResponse> {
    await new StopSay(this.request, this.voice).run({
      sessionRef: this.request.sessionRef
    });

    return { sessionRef: this.request.sessionRef };
  }

  /**
   * Record the audio of the call.
   *
   * @param {RecordOptions} options - Options to control the record operation
   * @param {number} options.maxDuration - The maximum duration of the recording in seconds. Default is 60
   * @param {number} options.maxSilence - The maximum duration of silence in seconds. Default is 5
   * @param {boolean} options.beep - Play a beep before recording. Default is true
   * @param {string} options.finishOnKey - Stop recording when a DTMF digit is received. Default is '#'
   * @return {RecordResponse} The record response
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   const record = await response.record();
   *   console.log("Recording: %s", record.name);
   * }
   */
  async record(options?: RecordOptions): Promise<RecordResponse> {
    const response = await new Record(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      ...options
    });

    return response.recordResponse;
  }

  /**
   * Dials a destination and returns a stream of status.
   *
   * @param {string} destination - The destination to dial
   * @param {DialOptions} options - Options to control the dial operation
   * @param {number} options.timeout - The timeout in seconds. Default is 60
   * @param {RecordDirection} options.recordDirection - The direction to record the call (IN, OUT, BOTH). Default is BOTH
   * @return {Promise<DialStatusStream>} The dial status stream
   */
  async dial(
    destination: string,
    options?: DialOptions
  ): Promise<DialStatusStream> {
    const stream = new DialStatusStream();

    await new Dial(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      destination,
      ...options
    });

    this.voice.on(StreamEvent.DATA, (result) => {
      if (result.dialResponse) {
        stream.emit(result.dialResponse.status);
      }
    });

    return stream;
  }

  /**
   * Starts a bidirectional audio stream between the call and the application.
   *
   * @param {StreamOptions} options - Options to control the stream operation
   * @param {StreamDirection} options.direction - The direction to stream the audio (IN, OUT, BOTH). Default is BOTH
   * @param {StreamAudioFormat} options.format - The audio format to stream (WAV). Default is WAV
   * @return {Promise<Stream>} The stream object
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *
   *   const stream = await response.stream({
   *     direction: StreamDirection.BOTH
   *   });
   *
   *   stream.onPayload((payload) => {
   *     // Use the payload
   *   });
   *
   *   // Or write to the stream
   *   // stream.write({ type: StreamMessageType.AUDIO_OUT, payload: "\x00\x01\x02" });
   * }
   */
  async stream(options?: StreamOptions): Promise<Stream> {
    const stream = new Stream();

    const startStream = new StartStream(this.request, this.voice);
    const stopStream = new StopStream(this.request, this.voice);

    const { startStreamResponse } = await startStream.run({
      sessionRef: this.request.sessionRef,
      ...options
    });

    this.voice.on(StreamEvent.DATA, (result) => {
      if (result.streamPayload) {
        stream.emit("payloadOut", result.streamPayload);
      }
    });

    stream.onPayloadIn((payload) => {
      this.voice.write({
        streamPayload: payload
      });
    });

    stream.cleanup(() => {
      stopStream.run({
        sessionRef: this.request.sessionRef,
        streamRef: startStreamResponse?.streamRef
      });
    });

    return stream;
  }

  /**
   * Starts a server-side stream gather operation which sends transcription data to the voice server.
   *
   * @param {StreamGatherOptions} options - Options to control the stream gather operation
   * @param {StreamGatherSource} options.source - The source to gather data from (DTMF, SPEECH, SPEECH_AND_DTMF). Default is SPEECH
   * @return {Promise<StreamGatherStream>} The stream gather object
   * @see Gather
   * @example
   *
   * async function handler (request, response) {
   *  await response.answer();
   *  const sGather = await response.sgather({ source: StreamGatherSource.SPEECH });
   *  sGather.onPayload((payload) => {
   *    console.log("Payload: %s", payload);
   *  });
   * }
   */
  async sgather(options: StreamGatherOptions): Promise<StreamGatherStream> {
    const stream = new StreamGatherStream();

    const startStreamGather = new StartStreamGather(this.request, this.voice);
    const stopStreamGather = new StopStreamGather(this.request, this.voice);

    await startStreamGather.run({
      sessionRef: this.request.sessionRef,
      ...options
    });

    this.voice.on(StreamEvent.DATA, (result) => {
      if (result.streamGatherPayload) {
        stream.emit("data", result.streamGatherPayload);
      }
    });

    stream.cleanup(() => {
      stopStreamGather.run({
        sessionRef: this.request.sessionRef
      });
    });

    return stream;
  }

  /**
   * Mutes a call.
   *
   * @param {MuteOptions} options - Options to control the mute operation
   * @param {MuteDirection} options.direction - The direction to mute the channel (IN, OUT, BOTH). Default is BOTH
   * @see unmute
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   await response.mute();       // Will mute both directions
   * }
   */
  async mute(
    options: MuteOptions = { direction: MuteDirection.BOTH }
  ): Promise<void> {
    const { direction } = options;

    await new Mute(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      direction
    });
  }

  /**
   * Unmute a call.
   *
   * @param {MuteOptions} options - Options to control the unmute operation
   * @param {MuteDirection} options.direction - The direction to unmute the call (IN, OUT, BOTH). Default is BOTH
   * @see mute
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   await response.unmute();     // Will unmute both directions
   * }
   */
  async unmute(
    options: MuteOptions = { direction: MuteDirection.BOTH }
  ): Promise<void> {
    const { direction } = options;

    await new Unmute(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      direction
    });
  }

  /**
   * Register a listener for the given event.
   *
   * @param {StreamEvent} event - The event to listen for
   * @param {Function} listener - The callback function
   * @example
   *
   * async function handler (request, response) {
   *  ...
   *
   *  response.on(StreamEvent.END, () => {
   *   console.log("Call ended");
   *  });
   * }
   */
  on(event: StreamEvent, listener: (...args: unknown[]) => void): void {
    this.voice.on(event, listener);
  }
}

export { VoiceResponse };
