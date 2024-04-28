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
import { status } from "@grpc/grpc-js";
import { z } from "zod";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type GRPCErrors = {
  code: number;
  message: string;
};

function handleError(
  error: Error | { code: string },
  callback: (error: GRPCErrors) => void
) {
  const code = (error as { code: string }).code;

  if (error instanceof z.ZodError) {
    const firstError = error.issues[0];
    logger.error("validation error:", { message: firstError.message });
    callback({ code: status.INVALID_ARGUMENT, message: firstError.message });
  } else if (code === "P2002") {
    const message = "Duplicated resource";
    logger.error("duplicated entity error:", { message });
    callback({ code: status.ALREADY_EXISTS, message });
  } else if (code === "P2025") {
    const message = "The requested resource was not found";
    logger.error("not found error:", { message });
    callback({ code: status.NOT_FOUND, message });
  } else if (code === "P2003") {
    const message = "A required foreign key was not provided";
    logger.error("missing foreign key error:", { message });
    callback({ code: status.FAILED_PRECONDITION, message });
  } else {
    logger.error("error creating user:", error);
    callback({ code: status.UNKNOWN, message: "Unknown error" });
  }
}

export { handleError, GRPCErrors };
