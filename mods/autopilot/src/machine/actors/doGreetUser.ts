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
import { fromPromise } from "xstate";
import { AutopilotContext } from "../types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

// Invoked (not fired-and-forgotten) so the machine stays in "greeting" until
// the first message has been fully played. Otherwise the idle clock would start
// while the assistant is still talking.
export const doGreetUser = fromPromise(
  async ({
    input,
    signal
  }: {
    input: { context: AutopilotContext };
    signal: AbortSignal;
  }) => {
    const { context } = input;

    logger.verbose("called the doGreetUser actor", {
      firstMessage: context.firstMessage
    });

    // The caller can barge in while this is still awaiting answer() or
    // playDtmf(). The machine then leaves "greeting" for "listeningToUser",
    // but it cannot cancel this promise -- so without these checks the
    // greeting would start playing on top of a caller who already has the
    // floor. xstate aborts the signal when it stops the invoked actor, which
    // is exactly that transition.
    try {
      await context.voice.answer();

      if (signal.aborted) {
        logger.verbose("user barged in during answer; skipping the greeting");
        return;
      }

      if (context.initialDtmf) {
        await context.voice.playDtmf(context.initialDtmf);

        if (signal.aborted) {
          logger.verbose("user barged in during dtmf; skipping the greeting");
          return;
        }
      }

      if (context.firstMessage) {
        await context.voice.say(context.firstMessage);
      }
    } catch (error) {
      logger.error("error while greeting the user", { error });
    }
  }
);
