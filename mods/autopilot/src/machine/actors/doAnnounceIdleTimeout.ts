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

// Invoked (not fired-and-forgotten) so the machine stays in
// "announcingIdleTimeout" until the idle message has been fully played. The
// idle clock is re-armed only when the machine returns to "idle", so the time
// the assistant spends talking never counts as user silence.
export const doAnnounceIdleTimeout = fromPromise(
  async ({ input }: { input: { context: AutopilotContext } }) => {
    const { context } = input;

    logger.verbose("called the doAnnounceIdleTimeout actor", {
      idleMessage: context.idleMessage,
      idleTimeoutCount: context.idleTimeoutCount
    });

    try {
      await context.voice.say(context.idleMessage);
    } catch (error) {
      logger.error("error while announcing the idle timeout", { error });
    }
  }
);
