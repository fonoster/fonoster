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
import { withErrorHandling } from "@fonoster/common";
import { withAccess } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { createGetFnUtil } from "./createGetFnUtil";
import {
  AppsDb,
  invalid,
  newSigningSecret,
  secretHint,
  SessionAppsConfig
} from "./session/appModel";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/**
 * New signing secret for an app. It takes effect at once: the old one stops working with no
 * overlap window (owner ruling B25), so the app must redeploy in step.
 */
function createRotateSigningSecret(prisma: AppsDb, config: SessionAppsConfig) {
  const getFn = createGetFnUtil(prisma);

  const rotateSigningSecret = async (call: { request: { ref: string } }) => {
    const { ref } = call.request;
    const app = await getFn(ref);
    if (app.type === "AUTOPILOT" && config.autopilotSigningSecret)
      throw invalid(
        "Autopilot apps use the platform's Autopilot secret; it is rotated by the operator"
      );
    const signingSecret = newSigningSecret();
    await prisma.application.update({
      where: { ref },
      data: { signingSecret, updatedAt: new Date() }
    });
    logger.verbose("rotated the signing secret", { ref });
    return { ref, signingSecret, signingSecretHint: secretHint(signingSecret) };
  };

  return withErrorHandling(
    withAccess(rotateSigningSecret, (ref: string) => getFn(ref))
  );
}

export { createRotateSigningSecret };
