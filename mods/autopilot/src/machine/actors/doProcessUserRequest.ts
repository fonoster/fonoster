/*
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
import { fromPromise } from "xstate";
import { getLogger } from "@fonoster/logger";
import { AutopilotContext } from "../types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export const doProcessUserRequest = fromPromise(
  async ({ input }: { input: { context: AutopilotContext } }) => {
    const { context } = input;
    logger.verbose("called processUserRequest actor", {
      speechBuffer: context.speechBuffer
    });

    // Stop any speech that might be playing
    await context.voice.stopSpeech();

    const languageModel = context.languageModel;
    const speech = context.speechBuffer.trim();
    const response = await languageModel.invoke(speech);

    try {
      if (response.type === "say" && !response.content) {
        logger.verbose("call might already be hung up");
        return;
      } else if (response.type === "hangup") {
        const message = context.goodbyeMessage;
        await context.voice.say(message);
        await context.voice.hangup();
        return;
      } else if (response.type === "transfer") {
        logger.verbose("transferring call to a number in the PSTN", {
          phoneNumber: context.transferPhoneNumber
        });
        const message = context.transferMessage!;
        await context.voice.say(message);
        await context.voice.stopStreams();
        await context.voice.transfer(context.transferPhoneNumber!, {
          record: true,
          timeout: 30
        });
        return;
      }

      await context.voice.say(response.content!);
    } catch (error) {
      logger.error("error processing user request", { error });
      await context.voice.say(context.systemErrorMessage);
    }
  }
);
