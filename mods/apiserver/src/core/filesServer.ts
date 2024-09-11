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

const CONTENT_TYPE = "audio/L16;rate=16000;channels=1";

function filesServer(params: { pathToFiles: string; port: number }) {
  const { pathToFiles, port } = params;
  const app = express();

  app.get("/sounds/:file", (req: Request, res: Response) => {
    const filePath = join(pathToFiles, req.params.file);

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.status(404).send("File not found!");
        return;
      }

      res.setHeader("content-type", CONTENT_TYPE);
      const readStream = fs.createReadStream(filePath);

      readStream.on("error", (error) => {
        logger.error(`Error reading file: ${error.message}`);
        res.status(500).send("Error reading file!");
      });

      readStream.pipe(res);
    });
  });

  app.listen(port, () => {
    logger.info(`Files server is running on port ${port}`);
  });
}

export { filesServer };
