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
import { z } from "zod";
import * as Messages from "./messages";

export enum EventsHookAllowedEvents {
  ALL = "all",
  CONVERSATION_STARTED = "conversation.started",
  CONVERSATION_ENDED = "conversation.ended"
}

export const EVENTS = [
  {
    value: EventsHookAllowedEvents.ALL,
    label: "All"
  },
  {
    value: EventsHookAllowedEvents.CONVERSATION_STARTED,
    label: "Conversation Started"
  },
  {
    value: EventsHookAllowedEvents.CONVERSATION_ENDED,
    label: "Conversation Ended"
  }
];

export const eventsHookSchema = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  events: z.array(z.nativeEnum(EventsHookAllowedEvents)).min(1)
});
