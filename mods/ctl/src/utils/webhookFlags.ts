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
import { Webhooks } from "@fonoster/common";
import { Flags } from "@oclif/core";

export const WEBHOOK_EVENTS = [...Webhooks.WEBHOOK_EVENT_TYPES] as string[];

export const eventFlag = (required: boolean) =>
  Flags.string({
    char: "e",
    description: `an event to receive (repeatable): ${WEBHOOK_EVENTS.join(", ")}`,
    options: WEBHOOK_EVENTS,
    multiple: true,
    required
  });

export { formatDate } from "./format";
