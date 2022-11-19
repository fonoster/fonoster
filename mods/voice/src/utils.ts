/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { ServerConfig } from "./types";
import { Verb } from "./verb";
import { join } from "path";
import fs from "fs";

/**
 * Takes a json object and creates a query formatted string
 *
 * @param {object} - a one level json object with the query options
 * @return {string} a string in the form of 'key1=value1&key2=value2&...'
 */
export const objectToQString = (obj: any = {}): string =>
  Object.keys(obj)
    .filter((key: string) => obj[key])
    .map((key: string) => {
      const encodedObj = obj[key] === "#" ? encodeURIComponent("#") : obj[key];
      return `${key}=${encodedObj}`;
    })
    .join("&");

async function sendMediaTransferEvent(
  verb: Verb,
  sessionId: string,
  event: string
) {
  await verb.post(
    `events/user/${event}`,
    objectToQString({
      // WARNING: Harcoded value
      application: "mediacontroller"
    }),
    {
      variables: {
        sessionId
      }
    }
  );
}

export async function startMediaTransfer(verb: Verb, sessionId: string) {
  await sendMediaTransferEvent(verb, sessionId, "SendExternalMedia");
}

export async function stopMediaTransfer(verb: Verb, sessionId: string) {
  await sendMediaTransferEvent(verb, sessionId, "StopExternalMedia");
}

export const serveFiles = (config: ServerConfig) => {
  return (req, res) => {
    // TODO: Update to use a stream instead of fs.readFile
    fs.readFile(
      join(config.pathToFiles, req.params.file),
      function (err, data) {
        if (err) {
          res.send("unable to find or open file");
        } else {
          // TODO: Set this value according to file extension
          res.setHeader("content-type", "audio/x-wav");
          res.send(data);
        }
        res.end();
      }
    );
  };
};
