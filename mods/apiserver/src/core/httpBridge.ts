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
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import {
  createUpdateMembershipStatus,
  IdentityConfig
} from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import express, { Request, Response } from "express";
import { APP_URL } from "../envs";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function httpBridge(identityConfig: IdentityConfig, params: { port: number }) {
  const { port } = params;
  const app = express();
  const streamMap = new Map<string, Readable>();

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

  app.get("/api/recordings/:id", (req: Request, res: Response) => {
    const RECORDINGS_PATH = path.join(
      "/opt/fonoster/recordings",
      req.params.id
    );
    const wave = fs.readFileSync(RECORDINGS_PATH);
    res.setHeader("content-type", "audio/wav");
    res.send(wave);
  });

  app.listen(port, () => {
    logger.info(`HTTP bridge is running on port ${port}`);
  });

  return {
    addStream: (id: string, stream: Readable) => {
      streamMap.set(id, stream);
    },
    removeStream: (id: string) => {
      logger.verbose(`removing stream with id: ${id}`);
      const stream = streamMap.get(id);
      if (stream) {
        stream.destroy();
      }
      streamMap.delete(id);
    },
    getStream: (id: string) => {
      return streamMap.get(id);
    }
  };
}

export { httpBridge };
