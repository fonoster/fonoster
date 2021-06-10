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
import VoiceEvents from "./events";
import HangupVerb from "./hangup/hangup";
import UnmuteVerb from "./unmute/unmute";
import GatherVerb, {GatherOptions} from "./gather/gather";
import MuteVerb, {MuteOptions} from "./mute/mute";
import PlayVerb, {PlayOptions} from "./play/play";
import RecordVerb, {RecordOptions, RecordResult} from "./record/record";
import {PlaybackControl} from "./playback/playback";
import {SayOptions} from "./say/types";
import {VoiceEventData, VoiceRequest} from "./types";
import {Plugin} from "@fonos/common";
import {assertPluginExist} from "./asserts";

/**
 * @classdesc Use the VoiceResponse object, to construct advance Interactive
 * Voice Response (IVR) applications.
 *
 * @extends Verb
 * @example
 *
 * import { VoiceServer } from "@fonos/voice";
 *
 * async function handler (request, response) {
 *   await response.play("sound:hello-world");
 * }
 *
 * const voiceServer = new VoiceServer({base: '/voiceapp'})
 * voiceServer.listen(handler, { port: 3000 })
 */
export default class {
  request: VoiceRequest;
  events: VoiceEvents;
  plugins: {};

  /**
   * Constructs a new VoiceResponse object.
   *
   * @param {VoiceRequest} request - Options to indicate the objects endpoint
   * @param {VoiceEvents} events - Events observer
   * @see module:core:FonosService
   */
  constructor(request: VoiceRequest, events: VoiceEvents) {
    this.request = request;
    this.events = events;
    this.plugins = {};
  }

  /**
   * Adds a tts or asr plugin. Only one type of plugin can be attached.
   *
   * @param plugin
   * @see GoogleTTS
   * @see MaryTTS
   */
  use(plugin: Plugin) {
    this.plugins[plugin.getType()] = plugin;
  }

  /**
   * Plays an audio in the channel.
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
   *   await response.play("https://soundsserver:900/sounds/hello-world.wav");
   * }
   */
  async play(media: string, options?: PlayOptions) {
    await new PlayVerb(this.request, this.events).run(media, options);
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
   *   response.use(new GoogleTTS())
   *   await response.say("Hello workd");   // Plays the sound using GoogleTTS's default values
   * }
   */
  async say(text: string, options?: SayOptions) {
    assertPluginExist(this, "tts");
    const tts = this.plugins["tts"];
    // It should return the filename and the generated file location
    const result = await tts.synthetize(text, options);
    const media = `sound:${this.request.selfEndpoint}/tts/${result.filename}`;
    await new PlayVerb(this.request, this.events).run(media, options);
  }

  /**
   * Waits for data entry from the user's keypad.
   *
   * @param {GatherOptions} options - Options to select the maximum number of digits, final character, and timeout
   * @param {number} options.numDigits - Milliseconds to skip before playing. Only applies to the first URI if multiple media URIs are specified
   * @param {number} options.timeout - Milliseconds to wait before timeout. Defaults to 4000. Use zero for no timeout.
   * @param {string} options.finishOnKey - Optional last character to wait for. Defaults to '#'. It will not be included in the returned digits
   * @example
   *
   * async function handler (request, response) {
   *   const digits = await response.gather({numDigits: 3});
   *   console.log("digits: " + digits);
   * }
   */
  async gather(options: GatherOptions) {
    await new GatherVerb(this.request, this.events).run(options);
  }

  /**
   * Returns a PlaybackControl control object.
   *
   * @param {string} playbackId - Playback identifier to use in Playback operations
   * @see Play
   * @example
   *
   * async function handler (request, response) {
   *   response.onDtmfReceived(async(digit) => {
   *      const control = response.playback("1234")
   *      digit === "3"
   *        ? await control.restart()
   *        : await control.forward()
   *   })
   *
   *   await response.play("https://soundsserver:900/sounds/hello-world.wav", {
   *      playbackId: "1234"
   *   });
   * }
   */
  playback(playbackId: string): PlaybackControl {
    return new PlaybackControl(this.request, playbackId);
  }

  /**
   * Listens for DtmfReceived events.
   *
   * @param {Function} handler - Event handler
   * @example
   *
   * async function handler (request, response) {
   *   response.onDtmfReceived(async(digit) => {
   *      const control = response.playback("1234")
   *      digit === "3"
   *        ? await control.restart()
   *        : await control.forward()
   *   })
   *
   *   await response.play("https://soundsserver:900/sounds/hello-world.wav", {
   *      playbackId: "1234"
   *   });
   * }
   */
  async onDtmfReceived(handler: Function) {
    this.events.subscribe(async (event: VoiceEventData) => {
      if (event.type === "DtmfReceived") {
        await handler(event);
      }
    });
  }

  /**
   * Listens for PlaybackFinished events.
   *
   * @param {Function} handler - Event handler
   * @example
   *
   * async function handler (request, response) {
   *   response.onPlaybackFinished(async(event) => {
   *      console.log(event.data)     // Returns playbackId
   *   })
   *
   *   await response.play("https://soundsserver:900/sounds/hello-world.wav", {
   *      playbackId: "1234"
   *   });
   * }
   */
  async onPlaybackFinished(handler: Function) {
    this.events.subscribe(async (event: VoiceEventData) => {
      if (event.type === "PlaybackFinished") {
        await handler(event.data);
      }
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
   *   await response.mute();       // Will mute both directions
   * }
   */
  async mute(options?: MuteOptions) {
    await new MuteVerb(this.request, this.events).run(options);
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
   *   await response.unmute({direction: "out"});       // Will unmute only the "out" direction
   * }
   */
  async unmute(options?: MuteOptions) {
    await new UnmuteVerb(this.request, this.events).run(options);
  }

  /**
   * Terminates the communication channel.
   *
   * @example
   *
   * async function handler (request, response) {
   *   await response.hangup();
   * }
   */
  async hangup() {
    await new HangupVerb(this.request, this.events).run();
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
   *   const result = await response.record({finishOnKey: "#"});
   *   console.log("recording result: " + JSON.stringify(result))     // recording result: { duration: 30 ...}
   * }
   */
  async record(options: RecordOptions): Promise<RecordResult> {
    return await new RecordVerb(this.request, this.events).run(options);
  }
}
