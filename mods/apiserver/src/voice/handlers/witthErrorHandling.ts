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
import { VerbRequest } from "@fonoster/common";

type VerbHandler = (request: VerbRequest) => Promise<void>;

function withErrorHandling(fn: VerbHandler) {
  return async (request: VerbRequest) => {
    try {
      return await fn(request);
    } catch (err) {
      if (err.message !== "Channel not found") {
        // FIXME: Implement sending error to the client
        // FIXME: This is good place to log application errors
        // voiceClient.sendResponse({
        //   error: {
        //     message: err.message,
        //     stack: err.stack
        //   }
        // });
        throw err;
      }
    }
  };
}

export { withErrorHandling };
