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
  createUpdateMembershipStatus,
  IdentityConfig
} from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import express, { Request, Response, Router } from "express";
import { APP_URL } from "../envs";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function httpBridge(
  identityConfig: IdentityConfig,
  params: { port: number; routers?: { path: string; router: Router }[] }
) {
  const { port } = params;
  const app = express();
  for (const r of params.routers ?? []) app.use(r.path, r.router);

  app.get(
    "/api/identity/accept-invite",
    async (req: Request, res: Response) => {
      try {
        await createUpdateMembershipStatus(identityConfig)(
          req.query.token as string
        );
        res.redirect(APP_URL);
      } catch (error) {
        logger.verbose("error updating membership status", error);
        res.redirect(identityConfig.workspaceInviteFailUrl);
      }
    }
  );

  app.listen(port, () => {
    logger.info(`HTTP bridge is running on port ${port}`);
  });
}

export { httpBridge };
