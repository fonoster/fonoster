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
  InterceptingCall,
  Interceptor,
  InterceptorOptions,
  NextCall,
  status
} from "@grpc/grpc-js";
import { AbstractClient } from "./AbstractClient";
import { isJwtExpired } from "./isJwtExpired";

class TokenRefresherNode {
  private client: AbstractClient;

  constructor(client: AbstractClient) {
    this.client = client;
  }

  createInterceptor(): Interceptor {
    return (
      options: InterceptorOptions,
      nextCall: NextCall
    ): InterceptingCall => {
      // `InterceptingCall` invokes `sendMessage` synchronously and discards its
      // return value, so this requester must not be `async`. An `async`
      // requester whose awaited `refreshToken()` rejects leaves that rejection
      // with no caller, which crashes the host process through Node's
      // unhandled-rejection handler. Instead, gate the outgoing message on the
      // refresh explicitly and turn a refresh failure into a gRPC status on
      // this call, so the caller can handle it. See fonoster/fonoster#887.
      const interceptingCall = new InterceptingCall(nextCall(options), {
        sendMessage: (message, next) => {
          if (!isJwtExpired(this.client.getAccessToken())) {
            next(message);
            return;
          }

          this.client.refreshToken().then(
            () => next(message),
            (err: unknown) => {
              const reason = err instanceof Error ? err.message : String(err);
              interceptingCall.cancelWithStatus(
                status.UNAVAILABLE,
                `Failed to refresh the access token: ${reason}`
              );
            }
          );
        }
      });

      return interceptingCall;
    };
  }
}

export { TokenRefresherNode };
