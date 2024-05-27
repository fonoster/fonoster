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
import { PlayOptions } from "./types";
import { Answer, Hangup, Play } from "./verbs";
import { Mute } from "./verbs/Mute";
import { PlayDtmf } from "./verbs/PlayDtmf";
import { MuteDirection, VoiceRequest, VoiceSessionStream } from "./verbs/types";
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
   * Answer the communication channel. Before running any other verb you
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
   * Hangup the communication channel.
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
   * Play an audio in the channel.
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
   * Play a series of DTMF digits in the channel.
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
   * Mutes a channel.
   *
   * @param {MuteDirection} direction - The direction to mute the channel (IN, OUT, BOTH). Default is BOTH
   * @see unmute
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   await response.mute();       // Will mute both directions
   * }
   */
  async mute(direction: MuteDirection = MuteDirection.BOTH): Promise<void> {
    return new Mute(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      direction
    });
  }

  /**
   * Unmutes a channel.
   *
   * @param {MuteDirection} direction - The direction to unmute the channel (IN, OUT, BOTH). Default is BOTH
   * @see mute
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   *   await response.unmute();     // Will unmute both directions
   * }
   */
  async unmute(direction: MuteDirection = MuteDirection.BOTH): Promise<void> {
    return new Unmute(this.request, this.voice).run({
      sessionRef: this.request.sessionRef,
      direction
    });
  }
}

export { VoiceResponse };
