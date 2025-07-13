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
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  withErrorHandling
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { CreateTestTokenResponse } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { TestTokenConfiguration } from "./types";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { IDENTITY_PRIVATE_KEY } from "../envs";
import { status } from "@grpc/grpc-js";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createCreateTestToken(config: TestTokenConfiguration) {
  const createApplication = async (
    call: unknown,
    callback: (
      error: GrpcErrorMessage,
      response?: CreateTestTokenResponse
    ) => void
  ) => {
    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    logger.verbose("call to createTestToken", {
      accessKeyId
    });

    // Build payload
    const payload = {
      ref: uuidv4(),
      domain: config.domain,
      displayName: config.displayName,
      signalingServer: config.signalingServer,
      targetAor: config.targetAor,
      username: config.username,
      accessKeyId,
      aorLink: config.targetAor,
      privacy: "NONE",
      allowedMethods: ["INVITE"]
    };

    // Sign JWT
    let token: string;

    try {
      token = jwt.sign(payload, IDENTITY_PRIVATE_KEY, {
        expiresIn: "1h",
        algorithm: "RS256"
      });
    } catch (err) {
      logger.error("failed to sign JWT", { error: err });
      callback({ code: status.INTERNAL, message: "Failed to sign JWT" });
      return;
    }

    const response = {
      token,
      ...config
    };

    callback(null, response);
  };

  return withErrorHandling(createApplication);
}

export { createCreateTestToken };
