/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/rox
 *
 * This file is part of Rox AI
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
import { EventsClient } from "./emitter";
import { getLogger } from "@fonoster/logger";
import WebSocket = require("ws");

const logger = getLogger({ service: "autopilot", filePath: __filename });

// Events server
export class EventsServer {
  clientConnections: Map<string, WebSocket>;
  wss: WebSocket.Server;
  port: number;

  constructor(clientConnections: Map<string, WebSocket>, port = 3001) {
    this.port = port;
    this.wss = new WebSocket.Server({ port });
    this.clientConnections = clientConnections;
  }

  start() {
    this.wss.on("connection", (ws) => {
      logger.verbose("received a new client connection");
      ws.on("message", (data) => {
        // Once we receive the first and only message from client we
        // save the client in the clientConnections map
        const clientId = JSON.parse(data.toString()).clientId;
        this.clientConnections.set(clientId, ws);
        logger.verbose("added clientId to list of connections", { clientId });
      });

      ws.send(
        JSON.stringify({
          name: "connected",
          payload: {}
        })
      );
    });

    logger.verbose("starting events server", { port: this.port });
  }

  getConnection(clientId: string): EventsClient | null {
    const connection = this.clientConnections.get(clientId);
    if (!connection) {
      return null;
    }
    return new EventsClient(connection);
  }

  removeConnection(clientId: string): void {
    this.clientConnections.delete(clientId);
  }
}

// Starting events server
export const eventsServer = new EventsServer(new Map());
