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
import { StreamEvent, VoiceSessionStreamServer } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const SERVICE_DEFINITION = {
  serviceName: "Voice",
  pckg: "voice",
  version: "v1beta2",
  proto: "voice.proto"
} as const;

function buildWelcomeDemoService() {
  return {
    definition: SERVICE_DEFINITION,
    handlers: {
      createSession: (voice: VoiceSessionStreamServer) => {
        let sessionRef: string | undefined;

        voice.on(
          StreamEvent.DATA,
          (params: {
            request?: { sessionRef: string; callerNumber: string };
            sayResponse?: unknown;
          }) => {
            try {
              const { request, sayResponse } = params;

              if (request) {
                const { callerNumber } = request;
                sessionRef = request.sessionRef;

                logger.verbose("welcome demo session started", {
                  sessionRef,
                  callerNumber
                });

                voice.write({
                  answerRequest: {
                    sessionRef: request.sessionRef
                  }
                });

                voice.write({
                  sayRequest: {
                    text: "Welcome to Fonoster! Your system is configured correctly and ready for voice application development. Goodbye!",
                    sessionRef: request.sessionRef
                  }
                });
              }

              if (sayResponse && sessionRef) {
                logger.verbose("hanging up welcome demo session", {
                  sessionRef
                });
                voice.write({
                  hangupRequest: {
                    sessionRef
                  }
                });
              }
            } catch (error) {
              logger.error("error in welcome demo session", {
                sessionRef,
                error
              });
              if (sessionRef) {
                voice.write({
                  hangupRequest: { sessionRef }
                });
              }
              voice.end();
            }
          }
        );

        voice.once(StreamEvent.END, () => {
          voice.end();
          logger.verbose("welcome demo session ended", { sessionRef });
        });

        voice.on(StreamEvent.ERROR, (error) => {
          logger.error("stream error in welcome demo session", {
            sessionRef,
            error
          });
          voice.end();
        });
      }
    }
  };
}

export { buildWelcomeDemoService };
