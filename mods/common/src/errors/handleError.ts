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
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { status } from "@grpc/grpc-js";
import { z } from "zod";
import { handleZodError } from "./handleZodError";
import { PrismaErrorEnum } from "./PrismaErrorEnum";
import { GRPCErrorMessage } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function handleError(
  error: Error | { code: string; message: string },
  callback: (error: GRPCErrorMessage) => void
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
    callback({ code: errorCode, message: errorMessage });
  };

  switch (code) {
    case PrismaErrorEnum.RECORD_ALREADY_EXISTS:
    case grpc.status.ALREADY_EXISTS:
      logAndCallback(
        status.ALREADY_EXISTS,
        message || "Duplicated resource",
        "duplicated entity error"
      );
      break;
    case PrismaErrorEnum.RECORD_NOT_FOUND:
    case grpc.status.NOT_FOUND:
      logAndCallback(
        status.NOT_FOUND,
        message || "The requested resource was not found",
        "not found error"
      );
      break;
    case PrismaErrorEnum.FAILED_PRECONDITION:
    case grpc.status.FAILED_PRECONDITION:
      logAndCallback(
        status.FAILED_PRECONDITION,
        message || "Failed precondition error (e.g., missing dependency)",
        "failed precondition error"
      );
      break;
    case grpc.status.PERMISSION_DENIED:
      logAndCallback(
        status.PERMISSION_DENIED,
        message || "Permission denied",
        "permission denied error"
      );
      break;
    case grpc.status.UNAUTHENTICATED:
      logAndCallback(
        status.UNAUTHENTICATED,
        message || "Unauthenticated",
        "unauthenticated error"
      );
      break;
    default:
      logger.error("unknown error:", error);
      callback({ code: status.UNKNOWN, message: message || "Unknown error" });
  }
}

export { handleError };
