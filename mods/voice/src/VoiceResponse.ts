/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { Answer, Hangup, Play } from "./verbs";
import { Gather } from "./verbs/Gather";
import { Mute } from "./verbs/Mute";
import { PlayDtmf } from "./verbs/PlayDtmf";
import {
  GatherOptions,
  GatherSource,
  MuteDirection,
  MuteOptions,
  PlayOptions,
  VoiceRequest,
  VoiceSessionStream
} from "./verbs/types";
import { Unmute } from "./verbs/Unmute";

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
class VoiceResponse {
  voice: VoiceSessionStream;
  request: VoiceRequest;

  /**
   * Constructs a new VoiceResponse object.
   *
   * @param {VoiceRequest} request - Options to indicate the objects endpoint
   * @param {VoiceSessionStream} voice - The voice session stream
   * @see module:core:APIClient
   */
  constructor(request: VoiceRequest, voice: VoiceSessionStream) {
    this.voice = voice;
    this.request = request;
  }

  /**
   * Answer the call. Before running any other verb you
   * must run the anwer command.
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   * }
   */
  async answer(): Promise<void> {
    return new Answer(this.request, this.voice).run();
  }

  /**
   * Hangup the call.
   * @example
   *
   * async function handler (request, response) {
   *  await response.hangup();
   * }
   */
  async hangup(): Promise<void> {
    return new Hangup(this.request, this.voice).run();
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
  async play(url: string, options?: PlayOptions): Promise<void> {
    return new Play(this.request, this.voice).run({
      ...options,
      sessionRef: this.request.sessionRef,
      url
    });
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
    return new PlayDtmf(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      digits
    });
  }

  /**
   * Waits for data entry from the user's keypad or from a speech provider.
   *
   * @param {GatherOptions} options - Options to select the maximum number of digits, final character, and timeout
   * @param {number} options.maxDigits - Maximum number of digits to collect. Defaults to 1
   * @param {number} options.timeout - Milliseconds to wait before timeout. Defaults to 4000. Use zero for no timeout.
   * @param {string} options.finishOnKey - Optional last character to wait for. Defaults to '#'. It will not be included in the returned digits
   * @param {GatherSource} options.source - Where to listen as input source. This option accepts `DTMF` and `SPEECH`. A speech provider must be configure
   * when including the `SPEECH` source. You might inclue both with `SPEECH_AND_DTMF`. Defaults to `SPEECH_AND_DTMF`
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
  ): Promise<void> {
    return new Gather(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      ...options
    });
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
    return new Mute(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      direction
    });
  }

  /**
   * Unmutes a call.
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
    return new Unmute(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      direction
    });
  }
}

export { VoiceResponse };
