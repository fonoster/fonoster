#!/usr/bin/env node
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
import { ARI_INTERNAL_URL, ARI_SECRET, ARI_USERNAME } from "./envs";
import { getLogger } from "@fonoster/logger";
import ariClient from "ari-client";
import wait from "wait-port";
import events from "./events_handler";

const logger = getLogger({ service: "dispatcher", filePath: __filename });

const connection = {
  host: ARI_INTERNAL_URL.split("//")[1].split(":")[0],
  port: parseInt(ARI_INTERNAL_URL.split("//")[1].split(":")[1]),
  timeout: 30000
};

async function connectToARI() {
  logger.info("Waiting for Asterisk to be ready...");
  const open = await wait(connection);
  if (open) {
    const ari = await ariClient.connect(
      ARI_INTERNAL_URL,
      ARI_USERNAME,
      ARI_SECRET,
      events
    );

    ari.on("WebSocketReconnecting", (event) => {
      logger.info("reconnecting to asterisk");
    });

    ari.on("WebSocketMaxRetries", (event) => {
      logger.error("max retries reconnecting to asterisk");
      attemptReconnection();
    });

    logger.info("asterisk is ready");
  } else {
    logger.error("asterisk is not ready");
    process.exit(1);
  }
}

function attemptReconnection() {
  logger.info("attempting to reconnect in 30 seconds...");
  setTimeout(() => {
    connectToARI();
  }, 30000); // Reconnect after 30 seconds
}

connectToARI().catch(logger.error);
