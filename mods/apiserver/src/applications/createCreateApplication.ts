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
import { CreateApplicationRequest } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import {
  AppsDb,
  assistantRow,
  newSigningSecret,
  secretHint,
  SessionAppsConfig,
  toAppColumns
} from "./session/appModel";

type CreateApplicationResponse = {
  ref: string;
  signingSecret: string;
  signingSecretHint: string;
};

const logger = getLogger({ service: "apiserver", filePath: __filename });

/**
 * Creates an application (a stream or an Autopilot agent). The response carries the signing secret, the only time it is shown.
 * Autopilot apps share the configured Autopilot secret when one is set (CP-B3).
 */
function createCreateApplication(prisma: AppsDb, config: SessionAppsConfig) {
  const createApplication = async (
    call: { request: CreateApplicationRequest },
    callback: (
      error: GrpcErrorMessage,
      response?: CreateApplicationResponse
    ) => void
  ) => {
    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );
    const request = call.request as unknown as Record<string, unknown>;

    logger.verbose("call to createApplication", {
      accessKeyId,
      type: request.type
    });

    const { columns, assistant, autopilot } = await toAppColumns(
      prisma,
      request,
      { accessKeyId, config }
    );
    const shared = autopilot ? config.autopilotSigningSecret : undefined;
    const signingSecret = shared ?? newSigningSecret();
    const intelligence = assistant
      ? { create: await assistantRow(prisma, assistant) }
      : undefined;

    const result = await prisma.application.create({
      data: { ...columns, signingSecret, accessKeyId, intelligence }
    });

    callback(null, {
      ref: result.ref,
      // A shared Autopilot secret is the operator's, not the app's to show.
      signingSecret: shared ? "" : signingSecret,
      signingSecretHint: secretHint(signingSecret)
    });
  };

  return withErrorHandling(createApplication);
}

export { createCreateApplication };
