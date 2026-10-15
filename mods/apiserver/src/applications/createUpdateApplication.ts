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
import { getAccessKeyIdFromCall, withErrorHandling } from "@fonoster/common";
import { withAccess } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { UpdateApplicationRequest } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { createGetFnUtil } from "./createGetFnUtil";
import {
  AppsDb,
  assistantRow,
  newSigningSecret,
  SessionAppsConfig,
  toAppColumns
} from "./session/appModel";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/**
 * Replaces an app's settings (PUT semantics, CP-B2): fields left out go back to their defaults.
 * The signing secret is kept; rotate it with RotateSigningSecret.
 */
function createUpdateApplication(prisma: AppsDb, config: SessionAppsConfig) {
  const getFn = createGetFnUtil(prisma);

  const updateApplication = async (call: {
    request: UpdateApplicationRequest;
  }) => {
    const { ref } = call.request;
    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );
    const existing = (await getFn(ref)) as unknown as {
      name: string;
      type: string;
      signingSecret?: string | null;
    };
    const request = {
      ...(call.request as unknown as Record<string, unknown>),
      name: call.request.name || existing.name,
      type: (call.request.type as string) || existing.type
    };

    logger.verbose("call to updateApplication", { accessKeyId, ref });

    const { columns, assistant, autopilot } = await toAppColumns(
      prisma,
      request,
      { accessKeyId, ref, config }
    );
    const intelligence = assistant
      ? await assistantRow(prisma, assistant)
      : undefined;
    // An app that became an Autopilot app takes the shared secret; one that stopped being one
    // needs its own.
    let signingSecret: string | undefined;
    if (autopilot && config.autopilotSigningSecret)
      signingSecret = config.autopilotSigningSecret;
    else if (
      !existing.signingSecret ||
      existing.signingSecret === config.autopilotSigningSecret
    )
      signingSecret = newSigningSecret();

    await prisma.$transaction([
      prisma.intelligence.deleteMany({ where: { applicationRef: ref } }),
      prisma.application.update({
        where: { ref, accessKeyId },
        data: {
          ...columns,
          ...(signingSecret ? { signingSecret } : {}),
          updatedAt: new Date(),
          ...(intelligence ? { intelligence: { create: intelligence } } : {})
        }
      })
    ]);

    return { ref };
  };

  return withErrorHandling(
    withAccess(updateApplication, (ref: string) => getFn(ref))
  );
}

export { createUpdateApplication };
