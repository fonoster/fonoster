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
import { assign } from "xstate";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export const appendSpeech = assign(({ context, event }) => {
  const speech = (event as unknown as { speech: string }).speech;

  logger.verbose("called the appendSpeech action", { speech });

  if (!speech) {
    return context;
  }

  context.speechBuffer = (
    (context.speechBuffer ?? "") +
    " " +
    speech
  ).trimStart();

  return context;
});
