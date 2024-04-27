#!/usr/bin/env node
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
import { getLogger } from "@fonoster/logger";
import runServices from "./runServices";
import { createDefaultPeer } from "./sipnet/peers/createDefaultPeer";

async function main() {
  // Create a Peer for the default region, if it doesn't already exist
  await createDefaultPeer();

  // Start the gRPC server
  await runServices();
}

const logger = getLogger({ service: "apiserver", filePath: __filename });

main().catch(logger.error);
