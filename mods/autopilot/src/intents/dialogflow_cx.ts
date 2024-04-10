/* eslint-disable no-loops/no-loops */
/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/rox
 *
 * This file is part of Rox AI
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
import { DialogFlowCXConfig, IntentsEngine, Intent } from "./types";
import { transformPayloadToEffect } from "./df_utils";
import { Effect } from "../cerebro/types";
import { JsonObject, struct } from "pb-util";
import { getLogger } from "@fonoster/logger";
import dialogflow, { SessionsClient } from "@google-cloud/dialogflow-cx";
import uuid = require("uuid");

const logger = getLogger({ service: "autopilot", filePath: __filename });

type DetectItemRequest = {
  session: string;
  queryParams: Record<string, unknown>;
  queryInput:
    | { text: { text: string } }
    | ({ event: { event: string } } & { languageCode: string });
};

export default class DialogFlowCX implements IntentsEngine {
  sessionClient: SessionsClient;
  sessionPath: string;
  config: DialogFlowCXConfig;
  projectId: string;
  location: string;
  agent: string;
  sessionId: string;
  constructor(config: DialogFlowCXConfig) {
    const sessionId = uuid.v4();
    this.projectId = config.projectId;
    this.location = config.location;
    this.config = config;
    this.sessionId = sessionId;
    this.agent = config.agent;

    // Create a new session
    this.sessionClient = new dialogflow.SessionsClient({
      apiEndpoint: `${config.location}-dialogflow.googleapis.com`,
      credentials: config.credentials
    });

    logger.verbose("created new dialogflow/cx session", {
      projectId: this.projectId,
      sessionId: this.sessionId
    });
  }

  setProjectId(id: string) {
    this.projectId = id;
  }

  async findIntent(
    text: string,
    payload?: Record<string, unknown>
  ): Promise<Intent> {
    const request = {
      session: this.getSessionPath(),
      queryParams: {},
      queryInput: {
        text: {
          text
        },
        languageCode: this.config.languageCode
      }
    };

    return this.detectIntent(request, payload);
  }

  async findIntentWithEvent(name: string, payload?: Record<string, unknown>) {
    const request = {
      session: this.getSessionPath(),
      queryParams: {},
      queryInput: {
        languageCode: this.config.languageCode,
        event: {
          event: name
        }
      }
    };

    return this.detectIntent(request, payload);
  }

  async detectIntent(
    request: DetectItemRequest,
    payload?: Record<string, unknown>
  ) {
    if (payload) {
      request.queryParams = { payload: struct.encode(payload as JsonObject) };
    }

    const [response] = await this.sessionClient.detectIntent(request);

    const effects: Effect[] = this.getEffects(
      response.queryResult.responseMessages as Record<string, unknown>[]
    );

    const params = struct.decode(
      response.queryResult.parameters as JsonObject
    ) as { skillCode: string };

    const ref = params.skillCode?.toString() || "unknown";

    return {
      ref,
      effects,
      confidence: response.queryResult.match?.confidence || 0
    };
  }

  private getSessionPath() {
    return this.sessionClient.projectLocationAgentSessionPath(
      this.projectId,
      this.location,
      this.agent,
      this.sessionId
    );
  }

  private getEffects(responseMessages: Record<string, unknown>[]): Effect[] {
    const effects: Effect[] = [];
    for (const r of responseMessages) {
      if (r.message === "text") {
        const res = r.text as Record<string, { text: string[] }>;
        effects.push({
          type: "say",
          parameters: {
            response: res.text[0]
          }
        });
      } else if (r.payload) {
        effects.push(transformPayloadToEffect(r.payload));
      }
    }
    return effects;
  }
}
