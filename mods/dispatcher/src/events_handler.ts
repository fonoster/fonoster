
/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import logger from "@fonos/logger";
import { CallRequest } from "./types";

export default function (err, client) {
  if (err) throw err;
  
  client.on("StasisStart", (event, channel) => {
    // Need to find the app owner's accessKeyId
    // Generate new service token
    // Get dialback endpoint

    const request:CallRequest = {
      accessKeyId: "",
      accessKeySecret: "",
      dialbackEnpoint: "string",
      sessionId: event.channel.id,
      callerId: event.channel.caller.name,
      callerNumber: event.channel.caller.number
    };

    console.log(`request=${JSON.stringify(event)}`);
  });
    
  client.on("StasisEnd", (event, channel) => {
    logger.debug(`channel.name=${channel.name}`);
  });

  client.start("mediacontroller");
}
