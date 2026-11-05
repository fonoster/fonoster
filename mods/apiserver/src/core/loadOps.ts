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
import type { FonosterConfig } from "../config/schema";
import type { Router } from "express";

/**
 * Fonoster's own ops API, under `features.ops`. @fonoster/ops is private and only a devDependency
 * here: it is imported only when on, or the published @fonoster/apiserver would crash at start.
 */
export async function loadOps(
  config: FonosterConfig["features"]["ops"]
): Promise<{ routers: { path: string; router: Router }[]; start(): void }> {
  if (!config.enabled) return { routers: [], start() {} };

  const { createOps } = await import("@fonoster/ops");
  const ops = createOps({
    secret: config.secret!,
    intervalMinutes: config.interop.intervalMinutes,
    databases: {
      fonoster: config.databases.fonoster!,
      identity: config.databases.identity!,
      routr: config.databases.routr!,
      billing: config.databases.billing!
    }
  });
  return {
    routers: [{ path: "/api/ops", router: ops.router }],
    start: ops.start
  };
}
