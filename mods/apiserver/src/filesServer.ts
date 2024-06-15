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
import fs from "fs";
import { join } from "path";
import { getLogger } from "@fonoster/logger";
import express, { Request, Response } from "express";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function filesServer(params: { pathToFiles: string; port: number }) {
  const { pathToFiles, port } = params;
  const app = express();

  app.get("/sounds/:file", (req: Request, res: Response) => {
    fs.readFile(join(pathToFiles, req.params.file), function (err, data) {
      if (err) {
        res.send("unable to find or open file");
      } else {
        res.setHeader("content-type", "audio/L16;rate=16000;channels=1");
        res.send(data);
      }
      res.end();
    });
  });

  app.listen(port, () => {
    logger.info(`files server is running on port ${port}`);
  });
}

export { filesServer };
