/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import { SynthResult, TTSConfig, TTSPlugin } from "./types";
import { Plugin } from "@fonoster/common";
import { computeFilename } from "./utils";
import path from "path";
import fs from "fs";
import os from "os";

export default abstract class AbstractTTS extends Plugin implements TTSPlugin {
  config: TTSConfig;

  constructor(type: string, name: string, config: TTSConfig) {
    super(type, name);
    this.config = config;
    this.config.path = config.path ? config.path : os.tmpdir();
  }

  /**
   * @inherit
   */
  async synthesize(text: string, options: any = {}): Promise<SynthResult> {
    const filename = computeFilename(text, options, "wav16");
    const pathToFile = path.join(this.config.path, filename);

    if (!fs.existsSync(pathToFile)) {
      return await this.synthesizeSpeech(text, options, filename, pathToFile);
    }
    return { filename, pathToFile };
  }

  abstract synthesizeSpeech(
    text: string,
    options: any,
    filename: string,
    pathToFile: string
  ): Promise<SynthResult>;
}

// .168.1.7:8088","url":"/ari/events/user/SendExternalMedia?application=mediacontroller"}
// /Users/psanders/Projects/fonoster/node_modules/google-gax/node_modules/@grpc/grpc-js/src/call.ts:81
//   const error = new Error(message);
//                 ^
// Error: 3 INVALID_ARGUMENT: Input text not set.
//     at Object.callErrorFromStatus (/Users/psanders/Projects/fonoster/node_modules/google-gax/node_modules/@grpc/grpc-js/src/call.ts:81:17)
//     at Object.onReceiveStatus (/Users/psanders/Projects/fonoster/node_modules/google-gax/node_modules/@grpc/grpc-js/src/client.ts:352:36)
//     at Object.onReceiveStatus (/Users/psanders/Projects/fonoster/node_modules/google-gax/node_modules/@grpc/grpc-js/src/client-interceptors.ts:462:34)
//     at Object.onReceiveStatus (/Users/psanders/Projects/fonoster/node_modules/google-gax/node_modules/@grpc/grpc-js/src/client-interceptors.ts:424:48)
//     at /Users/psanders/Projects/fonoster/node_modules/google-gax/node_modules/@grpc/grpc-js/src/call-stream.ts:330:24
//     at processTicksAndRejections (node:internal/process/task_queues:77:11)
// for call at
//     at ServiceClientImpl.makeUnaryRequest (/Users/psanders/Projects/fonoster/node_modules/google-gax/node_modules/@grpc/grpc-js/src/client.ts:324:26)
//     at ServiceClientImpl.<anonymous> (/Users/psanders/Projects/fonoster/node_modules/google-gax/node_modules/@grpc/grpc-js/src/make-client.ts:189:15)
//     at /Users/psanders/Projects/fonoster/node_modules/@google-cloud/dialogflow/src/v2beta1/sessions_client.ts:379:25
//     at /Users/psanders/Projects/fonoster/node_modules/google-gax/src/normalCalls/timeout.ts:54:13
//     at repeat (/Users/psanders/Projects/fonoster/node_modules/google-gax/src/normalCalls/retries.ts:104:19)
//     at /Users/psanders/Projects/fonoster/node_modules/google-gax/src/normalCalls/retries.ts:144:7
//     at OngoingCallPromise.call (/Users/psanders/Projects/fonoster/node_modules/google-gax/src/call.ts:81:23)
//     at NormalApiCaller.call (/Users/psanders/Projects/fonoster/node_modules/google-gax/src/normalCalls/normalApiCaller.ts:43:15)
//     at /Users/psanders/Projects/fonoster/node_modules/google-gax/src/createApiCall.ts:116:26
//     at processTicksAndRejections (node:internal/process/task_queues:95:5) {
//   code: 3,
//   details: 'Input text not set.',
//   metadata: Metadata {
//     internalRepr: Map(2) {
//       'endpoint-load-metrics-bin' => [Array],
//       'grpc-server-stats-bin' => [Array]
//     },
//     options: {}
//   },
//   note: 'Exception occurred in retry method that was not classified as transient'
// }
// [nodemon] app crashed - waiting for file changes before starting...
