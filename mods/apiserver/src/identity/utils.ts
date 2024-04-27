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
import jwt from "jsonwebtoken";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function isValidToken(token: string, secret: string): boolean {
  try {
    const decoded = jwt.verify(token, secret) as { exp: number };
    const currentTime = Math.floor(Date.now() / 1000);

    if (decoded.exp <= currentTime) {
      logger.verbose("token expired", { exp: decoded.exp, currentTime });
      return false;
    }

    return true;
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      logger.verbose("invalid JWT:", error.message);
    } else if (error.name === "TokenExpiredError") {
      logger.verbose("token expired");
    } else {
      logger.verbose("unexpected JWT error:", error);
    }

    return false;
  }
}

function getTokenFromCall(call: grpc.ServerInterceptingCall) {
  const metadata = (
    call as unknown as { metadata: grpc.Metadata }
  ).metadata.getMap();

  return metadata["token"]?.toString();
}

export { isValidToken, getTokenFromCall };
