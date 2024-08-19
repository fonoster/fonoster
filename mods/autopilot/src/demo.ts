/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import VoiceServer, { VoiceRequest, VoiceResponse } from "@fonoster/voice";
import { Model } from "./assistants/types";
import { Autopilot } from "./Autopilot";
import { OPENAI_API_KEY } from "./envs";

const logger = getLogger({ service: "autopilot", filePath: __filename });

// Only skip identity for local development
new VoiceServer({ skipIdentity: true }).listen(
  async (req: VoiceRequest, voice: VoiceResponse) => {
    const { ingressNumber, sessionRef, appRef } = req;

    logger.verbose("voice request", { ingressNumber, sessionRef, appRef });

    const autopilot = new Autopilot({
      voice,
      firstMessage:
        "Hello, I'm Martha the AI assistant from Restaurant La Casa. How can I help you today?",
      assistantConfig: {
        apiKey: OPENAI_API_KEY!,
        model: Model.GPT_4O_MINI,
        temperature: 0.7,
        maxTokens: 100,
        systemTemplate: `
          ## La casa AI Phone Assistant (Martha)

          ### Mission Statement

          To assist users in navigating our restaurant's offerings. This includes providing information on the menu, 
          handling reservations, and updating on special events.

          ### Interaction Modes

          - **Age Restriction:** None; suitable for all ages.
          - **Meal Options:** Brunch, Lunch, Dinner.
          - **Special Notes:** Users should specify any dietary restrictions or preferences.

          ### Available Links

          Since you are a AI Phone assistant, you can't browse the web. However, you can send links to the user's phone via SMS.
          Here are some useful links for Restaurant La Casa:

          - [Menu Information](https://www.lacasarestaurant.com/menu)
          - [Make a Reservation](https://www.lacasarestaurant.com/reservations)
          - [Special Events Details](https://www.lacasarestaurant.com/events)

          ### Hours of Operation

          - **Brunch:** 9:00 AM - 12:00 PM
          - **Lunch:** 12:00 PM - 3:00 PM
          - **Dinner:** 5:00 PM - 10:00 PM

          ### Special Instructions

          Provide accurate and timely responses to user inquiries. Stay on brand and maintain a friendly and professional tone.
          Only provide information that is relevant to the user's request. If the user asks for something that is not within the scope of the system,
          politely inform them that you are unable to assist with that request.

          In case of any medical emergency instruct the user to call 911 immediately.
        `
      }
    });

    autopilot.start();
  }
);
