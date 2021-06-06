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
import GatherVerb, { GatherOptions } from "./gather/gather";
import PlayVerb from "./play/play";
import { PlayOptions } from "./play/types";
import { PlaybackControl } from "./playback/playback";
import { VoiceEventData, VoiceRequest } from "./types";

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
 * const voiceServer = new VoiceServer({path: '/voiceapp'})
 * voiceServer.listen(handler, { port: 3000 })
 */
export default class {
  request: VoiceRequest;
  events: VoiceEvents;

  /**
   * Constructs a new VoiceResponse object.
   * 
   * @param {VoiceRequest} request - Options to indicate the objects endpoint
   * @param {VoiceEvents} events - Options to indicate the objects endpoint
   * @see module:core:FonosService
   */
  constructor(request: VoiceRequest, events: VoiceEvents) {
    this.request = request;
    this.events = events;
  }

  /**
   * Plays an audio in the channel.
   *
   * @param {string} media - sound name or uri with audio file
   * @param {PlayOptions} options - Optional parameters to alter the command's normal
   * behavior
   * @param {string} options.offset - milliseconds to skip before playing. Only applies to the first URI if multiple media URIs are specified
   * @param {string} options.skip - milliseconds to skip for forward/reverse operations
   * @param {string} options.playbackId - playback identifier to use in Playback operations
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
   * Waits for data entry from the user's keypad.
   *
   * @param {GatherOptions} options - options to select the maximum number of digits, final character, and timeout
   * @param {number} options.numDigits - milliseconds to skip before playing. Only applies to the first URI if multiple media URIs are specified
   * @param {number} options.timeout - milliseconds to wait before timeout. Defaults to 4000. Use zero for no timeout.
   * @param {string} options.finishOnKey - optional last character to wait to. Defaults to '#'. It will not be included in the returned digits
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
   * @param {string} playbackId - playback identifier to use in Playback operations
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
   * @param {Function} handler - event handler
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
      if (event.type === 'DtmfReceived') {
        await handler(event)
      }
    })
  }

  /**
   * Listens for PlaybackFinished events.
   *
   * @param {Function} handler - event handler
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
      if (event.type === 'PlaybackFinished') {
        await handler(event.data)
      }
    })
  }
}
