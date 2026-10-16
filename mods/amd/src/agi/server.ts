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

const logger = getLogger({ service: "amd", filePath: __filename });

const TIMED_OUT_RESULT = (): ProbeResult => ({
  kind: "unknown",
  cause: "ML-TIMEOUT",
  latencyMs: 0
});

// How long to wait, once the verdict is in, for AudioSocket() to return and
// free the AGI socket. The audio leg hangs up right after classifying and
// runProbe shares TIMEOUT_MS, so this only runs out on a genuinely stuck leg.
const AUDIOSOCKET_RELEASE_MS = 2000;

const delay = <T>(ms: number, value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

/**
 * Starts the FastAGI listener. Asterisk's `AGI(agi://amd:4573,${AMD_MODE})`
 * blocks the channel here. Per session: read the requested mode from the
 * dialplan's first AGI argument (`compact`, the default, or `full`), mint a
 * UUID, EXEC AudioSocket to pull the leading audio (blocks until the
 * AudioSocket side hangs up), await the correlated raw result, map it to
 * however many channel variables that mode produces, SET each, then return
 * so the dialplan resumes at Stasis(mediacontroller).
 *
 * Always fail-open: deadlines bound both the wait for a verdict and the wait
 * for AudioSocket() to return, and the AGI connection is always closed so the
 * dialplan resumes even when no variables could be set.
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

    const classification = registerPendingClassification(sessionId);

    // AudioSocket()'s result says nothing about whether AMD worked: Asterisk
    // before 20.14 returns -1 ("200 result=-1") whenever the remote ends the
    // stream, including the HANGUP this server sends after every
    // classification. It only tells us when the leg is over and the AGI
    // socket is free again.
    const legEnded = call
      .exec(
        "AudioSocket",
        `${sessionId},${AUDIOSOCKET_ADVERTISE_HOST}:${AUDIOSOCKET_PORT}`
      )
      .catch((err: Error) => {
        logger.verbose("AudioSocket() returned", {
          sessionId,
          result: err.message
        });
      });

    // The verdict is resolved in-process before the audio leg hangs up, so a
    // leg that ends first (e.g. Asterisk couldn't connect) has no verdict.
    const noVerdict: ProbeResult = {
      kind: "unknown",
      cause: "ML-ERROR",
      latencyMs: 0
    };
    const result = await Promise.race([
      classification,
      legEnded.then(() => noVerdict),
      delay(TIMEOUT_MS, TIMED_OUT_RESULT())
    ]);
    unregisterPendingClassification(sessionId);

    if (result === noVerdict) {
      logger.warn(
        "audiosocket leg ended without a verdict; reporting unknown",
        {
          sessionId
        }
      );
    }

    // FastAGI is one command at a time: SET VARIABLE can only be sent once
    // AudioSocket() has returned.
    const released = await Promise.race([
      legEnded.then(() => true),
      delay(AUDIOSOCKET_RELEASE_MS, false)
    ]);

    if (hungUp || call.hungup) {
      logger.verbose("agi call hung up mid-analysis; skipping SET VARIABLE", {
        sessionId
      });
      return;
    }

    if (!released) {
      logger.warn("audiosocket leg still open; skipping SET VARIABLE", {
        sessionId
      });
      call.close();
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
