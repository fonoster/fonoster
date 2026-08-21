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
import {
  AllowedHttpMethod,
  EventsHookAllowedEvents,
  eventsHookSchema,
  sendHttpRequest
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { EventsHook } from "./sendConversationEndedEvent";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export async function sendConversationStartedEvent(
  eventsHook: EventsHook,
  data: {
    appRef: string;
    callRef: string;
    phone: string;
  }
) {
  const { phone, appRef, callRef } = data;

  if (
    !eventsHook?.events.includes(
      EventsHookAllowedEvents.CONVERSATION_STARTED
    ) &&
    !eventsHook?.events.includes(EventsHookAllowedEvents.ALL)
  ) {
    return;
  }

  const parsedEventsHook = eventsHookSchema.parse(eventsHook);
  const params = {
    eventType: EventsHookAllowedEvents.CONVERSATION_STARTED,
    appRef,
    callRef,
    phone
  };

  logger.verbose("dispatching conversation.started webhook", {
    url: parsedEventsHook.url,
    eventType: params.eventType,
    appRef,
    callRef
  });

  try {
    await sendHttpRequest({
      url: parsedEventsHook.url!,
      method: AllowedHttpMethod.POST,
      headers: parsedEventsHook.headers,
      waitForResponse: false,
      params
    });
  } catch (e) {
    logger.error("failed to send conversation.started webhook", {
      url: parsedEventsHook.url,
      method: AllowedHttpMethod.POST,
      waitForResponse: false,
      appRef,
      callRef,
      error: e instanceof Error ? e.message : e
    });
  }
}
