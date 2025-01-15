/*
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
import { getAccessKeyIdFromCall, withErrorHandling } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ApplicationType, UpdateApplicationRequest } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { createGetFnUtil } from "./createGetFnUtil";
import { convertToApplicationData } from "./utils/convertToApplicationData";
import { validOrThrow } from "./validation/validOrThrow";
import { Prisma } from "../core/db";
import { withAccess } from "@fonoster/identity";
import { APISERVER_AUTOPILOT_ENDPOINT } from "../envs";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createUpdateApplication(prisma: Prisma) {
  const getFn = createGetFnUtil(prisma);

  const updateApplication = async (call: {
    request: UpdateApplicationRequest;
  }) => {
    const { request } = call;
    const { type, ref: applicationRef } = request;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    if (type === ApplicationType.AUTOPILOT && !request.endpoint) {
      logger.verbose("setting default endpoint for autopilot application", {
        autopilotEndpoint: APISERVER_AUTOPILOT_ENDPOINT
      });
      request.endpoint = APISERVER_AUTOPILOT_ENDPOINT;
    }

    validOrThrow(request);

    logger.verbose("call to updateApplication", {
      accessKeyId,
      type
    });

    await prisma.$transaction([
      prisma.textToSpeech.deleteMany({
        where: {
          applicationRef
        }
      }),
      prisma.speechToText.deleteMany({
        where: {
          applicationRef
        }
      }),
      prisma.intelligence.deleteMany({
        where: {
          applicationRef
        }
      }),
      prisma.application.update({
        where: {
          ref: applicationRef,
          accessKeyId
        },
        data: convertToApplicationData(request)
      })
    ]);

    return { ref: applicationRef };
  };

  return withErrorHandling(
    withAccess(updateApplication, (ref: string) => getFn(ref))
  );
}

export { createUpdateApplication };
