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
import * as grpcWeb from "grpc-web";
import { AbstractClient } from "./AbstractClient";
import { isJwtExpired } from "./isJwtExpired";

type ClientReadableStream = grpcWeb.ClientReadableStream<unknown>;

class TokenRefresherWeb {
  private client: AbstractClient;

  constructor(client: AbstractClient) {
    this.client = client;
  }

  intercept(
    request: unknown,
    invoker: (request: unknown) => ClientReadableStream
  ) {
    class InterceptedStream {
      refresher: TokenRefresherWeb;
      stream: ClientReadableStream;

      constructor(stream: ClientReadableStream, refresher: TokenRefresherWeb) {
        this.stream = stream;
        this.refresher = refresher;
      }

      on(eventType: string, callback: () => void) {
        const token = this.refresher.client.getAccessToken();

        if (isJwtExpired(token)) {
          this.refresher.client.refreshToken().then(() => {});
        }

        if (eventType == "data") {
          this.stream.on(eventType, callback);
        } else if (eventType == "error") {
          this.stream.on("error", callback);
        } else if (eventType == "metadata") {
          this.stream.on("metadata", callback);
        } else if (eventType == "status") {
          this.stream.on("status", callback);
        } else if (eventType == "end") {
          this.stream.on("end", callback);
        }

        return this;
      }
    }

    return new InterceptedStream(invoker(request), this);
  }
}

export { TokenRefresherWeb };
