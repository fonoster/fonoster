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
import { ClientOptions, WebClientOptions } from "./types";
const DEFAULT_ENDPOINT = "https://api.fonoster.io/api";

export default class {
  options: ClientOptions;
  api: any;

  /**
   * Use the Options object to overwrite the service default configuration.
   * @typedef {Object} Options
   * @property {string} endpoint - The endpoint URI to send requests to.
   * The endpoint should be a string like '{serviceHost}:{servicePort}'.
   * @property {string} accessKeyId - your Fonoster access key ID.
   * @property {string} accessKeySecret - your Fonoster secret access key.
   * @property {string} bucket - The bucket to upload apps and media files.
   */

  /**
   * Constructs a service object.
   *
   * @param {WebClientOptions} options - Overwrite for the service's defaults configuration.
   */
  constructor(API: any, name: string, options: WebClientOptions) {
    this.options = options;
    if (!this.options.endpoint) {
      this.options.endpoint = DEFAULT_ENDPOINT;
    }
    const config = new API.Configuration({
      basePath: this.options.endpoint,
      baseOptions: {
        headers: {
          access_key_id: this.options.accessKeyId,
          access_key_secret: this.options.accessKeySecret
        }
      }
    });
    this.api = new API[name](config);
  }

  // eslint-disable-next-line require-jsdoc
  async run(method: string, request: unknown): Promise<unknown> {
    try {
      return (await this.api[method](request as any)) as unknown;
    } catch (e) {
      if (e.response) {
        throw e.response.data;
      } else if (e.request) {
        // client never received a response, or request never left
      } else {
        // anything else
      }
    }
  }
}
