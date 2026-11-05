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
import { createHash, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import * as path from "path";
import { pipeline } from "stream";
import { NextFunction, Request, Response, Router } from "express";
import { readState, SAFE_NAME, State } from "./interop/scan";
import { OpsDatabases, readSnapshot } from "./metrics/readSnapshot";

const sha = (value: string) => createHash("sha256").update(value).digest();

function isToken(given: string, secret: string): boolean {
  return timingSafeEqual(sha(given), sha(secret));
}

function requireToken(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const [, token] =
      /^Bearer (.+)$/.exec(req.headers.authorization ?? "") ?? [];
    if (token && isToken(token, secret)) {
      next();
      return;
    }
    res
      .status(401)
      .set("WWW-Authenticate", "Bearer")
      .json({ error: "unauthorized" });
  };
}

const newestFirst = (a: { time: string }, b: { time: string }) =>
  b.time.localeCompare(a.time);

/** Failures first, then evidence, each newest first. */
function toAlerts(state: State) {
  const failures = Object.entries(state.failures).flatMap(([farEnd, rows]) =>
    Object.entries(rows).map(([signature, row]) => ({
      kind: "failure",
      far_end: farEnd,
      signature,
      count: row.files.length,
      time: row.time,
      file: row.file
    }))
  );
  const evidence = Object.entries(state.found).flatMap(([farEnd, rows]) =>
    Object.entries(rows).map(([id, row]) => ({
      kind: "evidence",
      far_end: farEnd,
      case: id,
      time: row.time,
      file: row.file
    }))
  );
  return [...failures.sort(newestFirst), ...evidence.sort(newestFirst)];
}

export function createOpsRouter(deps: {
  secret: string;
  tracesDir: string;
  stateDir: string;
  databases: OpsDatabases;
  lastPassFailed: () => boolean;
}): Router {
  const router = Router();
  router.use(requireToken(deps.secret));

  router.get("/interop/alerts", async (_req, res) => {
    try {
      if (deps.lastPassFailed()) throw new Error("the last pass failed");
      res.json({ alerts: toAlerts(await readState(deps.stateDir)) });
    } catch {
      res.status(503).json({ error: "scan_failed" });
    }
  });

  router.get("/interop/recordings/:file", async (req, res) => {
    const file = String(req.params.file);
    const handle = SAFE_NAME.test(file)
      ? await fs.open(path.join(deps.tracesDir, file)).catch(() => undefined)
      : undefined;
    if (!handle) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
    pipeline(handle.createReadStream(), res, () => undefined);
  });

  router.get("/metrics", async (_req, res) => {
    const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    try {
      res.json({ schema: 1, ts, ...(await readSnapshot(deps.databases)) });
    } catch {
      res.status(503).json({ schema: 1, ts, error: "query_failed" });
    }
  });

  // A recording's name with a bad escape never reaches its route: Express fails to decode it.
  router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof URIError) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    next(err);
  });

  return router;
}
