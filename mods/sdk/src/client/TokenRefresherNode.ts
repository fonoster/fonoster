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
  NextCall
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
      return new InterceptingCall(nextCall(options), {
        sendMessage: async (message, next) => {
          const token = this.client.getAccessToken();

          if (isJwtExpired(token)) {
            await this.client.refreshToken();
          }

          next(message);
        }
      });
    };
  }
}

export { TokenRefresherNode };
