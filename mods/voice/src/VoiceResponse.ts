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
import { Plugin } from "@fonoster/common";
import { PluginsObject, VoiceRequest, VoiceSessionStream } from "./types";

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
  plugins: { [key: string]: Plugin };

  /**
   * Constructs a new VoiceResponse object.
   *
   * @param {object} params - Parameters to initialize the object
   * @param {VoiceRequest} params.request - Options to indicate the objects endpoint
   * @param {VoiceSessionStream} params.voice - The voice session stream
   * @param {Plugin} params.plugins - Optional plugins to attach to the object
   * @see module:core:APIClient
   */
  constructor(params: {
    voice: VoiceSessionStream;
    request: VoiceRequest;
    plugins?: PluginsObject;
  }) {
    const { voice, request, plugins } = params;
    this.voice = voice;
    this.request = request;
    this.plugins = plugins || {};
  }

  /**
   * Adds a tts or asr plugin. Only one type of plugin can be attached.
   *
   * @param {Plugin} plugin - The plugin to add
   * @see GoogleTTS
   * @see GoogleASR
   */
  use(plugin: Plugin): void {
    this.plugins[plugin.getType()] = plugin;
  }

  /**
   * Answer the communication channel. Before running any other verb you
   * must run the anwer command.
   *
   * @example
   *
   * async function handler (request, response) {
   *   await response.answer();
   * }
   */
  async answer(): Promise<void> {
    const { sessionId } = this.request;
    this.voice.write({ answerCommand: { sessionId } });
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
  async play(media: string): Promise<void> {
    // Noop
  }
}

export { VoiceResponse };
