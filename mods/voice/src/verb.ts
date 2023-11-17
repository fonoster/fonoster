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
import axios from "axios";
import { VoiceRequest } from "./types";
import logger from "@fonoster/logger";

const auth =
  process.env.NODE_ENV != "production"
    ? {
        username: "admin",
        password: "changeit"
      }
    : null;

export class Verb {
  request: VoiceRequest;
  constructor(request: VoiceRequest) {
    this.request = request;
  }

  getSelf() {
    return this;
  }

  getRequest(): VoiceRequest {
    return this.request;
  }

  async post(
    apiPath: string,
    queryParameters: string,
    data?: Record<string, unknown>
  ) {
    const url = `${
      this.getRequest().dialbackEnpoint
    }/ari/${apiPath}?${queryParameters}`;

    logger.silly(`@fonoster/voice posting [url: ${url}]`);

    return await axios({
      method: "post",
      url,
      auth,
      headers: {
        "X-Session-Token": this.request.sessionToken,
        "Content-Type": "application/json"
      },
      data
    });
  }

  async delete(apiPath: string, queryParameters?: string) {
    const url = `${
      this.getRequest().dialbackEnpoint
    }/ari/${apiPath}?${queryParameters}`;

    logger.silly(`@fonoster/voice deleting [url: ${url}]`);

    return await axios({
      method: "delete",
      url,
      auth,
      headers: {
        "X-Session-Token": this.request.sessionToken
      }
    });
  }
}
