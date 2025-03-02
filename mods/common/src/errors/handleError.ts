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
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { status } from "@grpc/grpc-js";
import { z } from "zod";
import { handleZodError } from "./handleZodError";
import { PrismaErrorEnum } from "./PrismaErrorEnum";
import { GrpcErrorMessage } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function handleError(
  error: Error | { code: string; message: string },
  callback: (error: GrpcErrorMessage) => void
) {
  if (error instanceof z.ZodError) {
    handleZodError(error, callback);
    return;
  }

  const { code, message } = error as { code: string | number; message: string };

  const logAndCallback = (
    errorCode: number,
    errorMessage: string,
    logMessage: string
  ) => {
    logger.error(logMessage, { message: errorMessage });

    const messageParts = errorMessage.split(":");
    let effectiveErrorMessage = errorMessage;

    if (errorCode === status.NOT_FOUND && messageParts.length > 1) {
      effectiveErrorMessage = `Resource not found: ${messageParts[messageParts.length - 1].trim()}`;
    }

    callback({ code: errorCode, message: effectiveErrorMessage });
  };

  switch (code) {
    case PrismaErrorEnum.RECORD_ALREADY_EXISTS:
    case grpc.status.ALREADY_EXISTS:
      logAndCallback(
        status.ALREADY_EXISTS,
        "The resource already exists",
        "duplicated entity error"
      );
      break;
    case PrismaErrorEnum.RECORD_NOT_FOUND:
    case grpc.status.NOT_FOUND:
      logAndCallback(
        status.NOT_FOUND,
        "The requested resource was not found",
        "not found error"
      );
      break;
    case grpc.status.PERMISSION_DENIED:
      logAndCallback(
        status.PERMISSION_DENIED,
        "You don't have permission to perform this action",
        "permission denied error"
      );
      break;
    case grpc.status.UNAUTHENTICATED:
      logAndCallback(
        status.UNAUTHENTICATED,
        "You need to be authenticated to perform this action",
        "unauthenticated error"
      );
      break;
    case grpc.status.INVALID_ARGUMENT:
      logAndCallback(
        status.INVALID_ARGUMENT,
        message ?? "Your request has one or more invalid arguments",
        "invalid argument error"
      );
      break;
    default:
      logger.error("internal server error:", error);
      callback({ code: status.INTERNAL, message: "Internal server error" });
  }
}

export { handleError };
