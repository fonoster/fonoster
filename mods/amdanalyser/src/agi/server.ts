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
import { getLogger } from "@fonoster/logger";
import { v4 as uuidv4 } from "uuid";
import { buildAmdVariables, parseMode } from "../amd/buildAmdVariables";
import {
  AGI_PORT,
  AUDIOSOCKET_ADVERTISE_HOST,
  AUDIOSOCKET_PORT,
  MIN_CONFIDENCE,
  TIMEOUT_MS
} from "../envs";
import { ProbeResult } from "../probe/runProbe";
import { AgiChannel } from "./AgiChannel";
import { AgiServer } from "./AgiServer";
import {
  registerPendingClassification,
  unregisterPendingClassification
} from "./sessionRegistry";

const logger = getLogger({ service: "amdanalyser", filePath: __filename });

const TIMED_OUT_RESULT = (): ProbeResult => ({
  kind: "unknown",
  cause: "ML-TIMEOUT",
  latencyMs: 0
});

/**
 * Starts the FastAGI listener. Asterisk's `AGI(agi://amdanalyser:4573,${AMD_MODE})`
 * blocks the channel here. Per session: read the requested mode from the
 * dialplan's first AGI argument (`compact`, the default, or `full`), mint a
 * UUID, EXEC AudioSocket to pull the leading audio (blocks until the
 * AudioSocket side hangs up), await the correlated raw result, map it to
 * however many channel variables that mode produces, SET each, then return
 * so the dialplan resumes at Stasis(mediacontroller).
 *
 * Always fail-open: a `setTimeout` bounds the whole session even if the
 * AudioSocket side never resolves, and a top-level try/catch guarantees the
 * SET VARIABLE commands are still attempted before the handler returns — an
 * exception must never leave the AGI connection hanging.
 */
function startAgiServer(): AgiServer {
  const agi = new AgiServer({ port: AGI_PORT });

  agi.on("ready", (port: number) => {
    logger.info("agi server listening", { port });
  });

  agi.on("error", (err: Error) => {
    logger.error("agi server error", err);
  });

  agi.on("call", async (call: AgiChannel) => {
    const sessionId = uuidv4();
    const mode = parseMode(call.args[0]);
    let hungUp = false;
    call.once("hangup", () => {
      hungUp = true;
      unregisterPendingClassification(sessionId);
    });

    logger.verbose("agi call", { sessionId, mode, channel: call.channel });

    const timeout = new Promise<ProbeResult>((resolve) => {
      setTimeout(() => resolve(TIMED_OUT_RESULT()), TIMEOUT_MS);
    });

    // Wrapped as one promise so the deadline bounds the EXEC itself, not just
    // the wait that follows it — otherwise a stuck/unreachable AudioSocket
    // connection would hang here forever before the race below is ever
    // reached, despite the fail-open guarantee described above.
    const work = (async (): Promise<ProbeResult> => {
      const pending = registerPendingClassification(sessionId);
      await call.exec(
        "AudioSocket",
        `${sessionId},${AUDIOSOCKET_ADVERTISE_HOST}:${AUDIOSOCKET_PORT}`
      );
      return pending;
    })();
    work.catch(() => undefined); // no unhandled rejection if the deadline wins

    let result: ProbeResult;
    try {
      result = await Promise.race([work, timeout]);
    } catch (err) {
      logger.warn("agi session failed; reporting unknown", {
        sessionId,
        error: (err as Error).message
      });
      result = { kind: "unknown", cause: "ML-ERROR", latencyMs: 0 };
    } finally {
      unregisterPendingClassification(sessionId);
    }

    if (hungUp || call.hungup) {
      logger.verbose("agi call hung up mid-analysis; skipping SET VARIABLE", {
        sessionId
      });
      return;
    }

    const variables = buildAmdVariables(result, mode, MIN_CONFIDENCE);
    logger.verbose("agi call variables", { sessionId, mode, variables });

    try {
      // Sequential, not Promise.all: AgiChannel allows only one command in
      // flight on the AGI socket at a time.
      for (const [name, value] of Object.entries(variables)) {
        await call.setVariable(name, value);
      }
    } catch (err) {
      logger.warn("failed to set AMD channel variables", {
        sessionId,
        error: (err as Error).message
      });
    } finally {
      // Asterisk's AGI() app returns control to the dialplan when the AGI
      // script closes the connection — not on any special "done" command.
      // Always close, success or failure, or the channel would sit in
      // AGI() forever.
      if (!call.hungup) call.close();
    }
  });

  return agi;
}

export { startAgiServer };
