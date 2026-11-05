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
import { Interop } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Router } from "express";
import { createOpsRouter } from "./createOpsRouter";
import { scan } from "./interop/scan";
import { startLoop } from "./interop/startLoop";
import { OpsDatabases } from "./metrics/readSnapshot";

const logger = getLogger({ service: "ops", filePath: __filename });

const TRACES_DIR = "/var/routr/traces";
const STATE_DIR = "/var/lib/fonoster/ops";

export function createOps(config: {
  secret: string;
  intervalMinutes: number;
  databases: OpsDatabases;
  tracesDir?: string;
  stateDir?: string;
}): { router: Router; start(): void } {
  const tracesDir = config.tracesDir ?? TRACES_DIR;
  const stateDir = config.stateDir ?? STATE_DIR;
  let lastPassFailed = false;

  const pass = async () => {
    try {
      await scan({
        traces: tracesDir,
        state: stateDir,
        farEnds: Interop.knownFarEnds()
      });
      lastPassFailed = false;
    } catch (e) {
      lastPassFailed = true;
      const { path, code, name } = e as NodeJSError;
      logger.error(
        `ops: interop scan failed: ${path ?? stateDir} ${code ?? name}`
      );
    }
  };

  return {
    router: createOpsRouter({
      secret: config.secret,
      tracesDir,
      stateDir,
      databases: config.databases,
      lastPassFailed: () => lastPassFailed
    }),
    start: () => startLoop(pass, config.intervalMinutes * 60_000)
  };
}

type NodeJSError = Error & { path?: string; code?: string };
