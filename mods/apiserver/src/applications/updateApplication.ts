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
import { getAccessKeyIdFromCall, withAccess } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { createGetFnUtil } from "./createGetFnUtil";
import { UpdateApplicationRequest } from "./types";
import { convertToApplicationData } from "./utils/convertToApplicationData";
import { validOrThrow } from "./utils/validOrThrow";
import { Prisma } from "../core/db";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function updateApplication(prisma: Prisma) {
  const getFn = createGetFnUtil(prisma);

  return withAccess(
    async (call: { request: UpdateApplicationRequest }) => {
      const { type } = call.request;
      const accessKeyId = getAccessKeyIdFromCall(
        call as unknown as ServerInterceptingCall
      );

      validOrThrow(call.request);

      logger.verbose("call to updateApplication", {
        accessKeyId,
        type
      });

      // TODO: Revisit to see if needs optimization
      await prisma.$transaction([
        prisma.textToSpeech.deleteMany({
          where: {
            applicationRef: call.request.ref
          }
        }),
        prisma.speechToText.deleteMany({
          where: {
            applicationRef: call.request.ref
          }
        }),
        prisma.conversation.deleteMany({
          where: {
            applicationRef: call.request.ref
          }
        }),
        prisma.application.update({
          where: {
            ref: call.request.ref,
            accessKeyId
          },
          data: convertToApplicationData(call.request)
        })
      ]);

      return { ref: call.request.ref };
    },
    (ref: string) => getFn(ref)
  );
}

export { updateApplication };
