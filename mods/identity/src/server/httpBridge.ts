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
import express, { Request, Response } from "express";
import { IdentityConfig } from "../exchanges/types";
import { createUpdateMembershipStatus } from "../utils";

const logger = getLogger({ service: "identity", filePath: __filename });

/**
 * Minimal HTTP bridge for the standalone Identity service. It serves only the
 * accept-invite endpoint (the apiserver's bridge also serves telephony routes).
 */
function startHttpBridge(
  identityConfig: IdentityConfig,
  params: { port: number; appUrl: string }
) {
  const { port, appUrl } = params;
  const app = express();

  app.get(
    "/api/identity/accept-invite",
    async (req: Request, res: Response) => {
      try {
        await createUpdateMembershipStatus(identityConfig)(
          req.query.token as string
        );
        res.redirect(appUrl);
      } catch (error) {
        logger.verbose("error updating membership status", error);
        res.redirect(identityConfig.workspaceInviteFailUrl);
      }
    }
  );

  app.listen(port, () => {
    logger.info(`Identity HTTP bridge running on port ${port}`);
  });

  return app;
}

export { startHttpBridge };
