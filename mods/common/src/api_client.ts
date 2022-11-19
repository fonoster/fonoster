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
import { getClientCredentials } from "./trust_util";
import { ClientOptions } from "./types";
import * as fs from "fs";
import * as path from "path";
import { Metadata } from "@grpc/grpc-js";

const CONFIG_FILE =
  process.env.API_CONFIG_FILE ||
  path.join(require("os").homedir(), ".fonoster", "config");
const configFileExit = () => fs.existsSync(CONFIG_FILE);
const getConfigFile = () => JSON.parse(fs.readFileSync(CONFIG_FILE).toString());

const defaultOptions: ClientOptions = {
  endpoint: process.env.APISERVER_ENDPOINT || "api.fonoster.io",
  accessKeyId: process.env.ACCESS_KEY_ID,
  accessKeySecret: process.env.ACCESS_KEY_SECRET
};

export default class {
  options: ClientOptions;
  metadata: Metadata;
  ServiceClient: any;
  service: any;

  /**
   * Use the Options object to overwrite the service default configuration.
   * @typedef {ClientOptions} Options
   * @property {string} endpoint - The endpoint URI to send requests to.
   * The endpoint should be a string like '{serviceHost}:{servicePort}'.
   * @property {string} accessKeyId - your Fonoster access key ID.
   * @property {string} accessKeySecret - your Fonoster secret access key.
   * @property {string} bucket - The bucket to upload apps and media files.
   */

  /**
   * Constructs a service object.
   *
   * @param {Options} options - Overwrite for the service's defaults configuration.
   */
  constructor(ServiceClient: any, options: ClientOptions) {
    this.ServiceClient = ServiceClient;
    this.options = options;
  }

  init(): void {
    try {
      if (!this.options && configFileExit()) {
        this.options = getConfigFile();
      }
    } catch (err) {
      throw new Error(`Malformed config file found at: ${CONFIG_FILE}`);
    }

    if (!this.options) {
      this.options = defaultOptions;
    }

    if (!this.options.accessKeyId || !this.options.accessKeySecret) {
      throw new Error("Not valid credentials found");
    }

    this.metadata = new Metadata();
    this.metadata.add("access_key_id", this.options.accessKeyId);
    this.metadata.add("access_key_secret", this.options.accessKeySecret);

    this.service = new this.ServiceClient(
      this.options.endpoint || defaultOptions.endpoint,
      getClientCredentials()
    );
  }

  getOptions(): ClientOptions {
    return this.options;
  }

  getService(): any {
    return this.service;
  }

  getMeta(): Metadata {
    return this.metadata;
  }
}
