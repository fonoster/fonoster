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
  datesMapper,
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import {} from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { ListSecretsRequest, ListSecretsResponse } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../core/db";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function listSecrets(prisma: Prisma) {
  const fn = async (
    call: {
      request: ListSecretsRequest;
    },
    callback: (error: GrpcErrorMessage, response?: ListSecretsResponse) => void
  ) => {
    const { pageSize, pageToken } = call.request;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    logger.verbose("call to getSecret", {
      accessKeyId,
      pageSize,
      pageToken
    });

    const result = (
      await prisma.secret.findMany({
        where: { accessKeyId },
        take: pageSize,
        skip: pageToken ? 1 : 0,
        cursor: pageToken ? { ref: pageToken } : undefined
      })
    ).map(datesMapper);

    callback(null, {
      items: result,
      nextPageToken:
        result.length < pageSize ? undefined : result[result.length - 1]?.ref
    });
  };

  return withErrorHandlingAndValidation(fn, V.listRequestSchema);
}

export { listSecrets };
