/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import WebSocket from "ws";

export function sendData(ws: WebSocket, data: Buffer, sessionId: string) {
  try {
    ws.send(
      Buffer.concat([
        Buffer.from("" + sessionId.length),
        Buffer.from(sessionId),
        data
      ])
    );
  } catch (e) {
    /** Must catch to prevent app from crashing if channel closed */
  }
}

export function streamConfig(address: string) {
  return {
    app: "mediacontroller",
    external_host: address,
    format: "slin16"
  };
}
