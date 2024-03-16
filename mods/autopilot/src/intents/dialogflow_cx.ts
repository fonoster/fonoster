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
import { getLogger } from "@fonoster/logger";
import dialogflow, { SessionsClient } from "@google-cloud/dialogflow-cx";
import uuid = require("uuid");

const logger = getLogger({ service: "autopilot", filePath: __filename });

export default class DialogFlowCX implements IntentsEngine {
  sessionClient: SessionsClient;
  sessionPath: any;
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

  async findIntent(txt: string): Promise<Intent> {
    const sessionPath = this.sessionClient.projectLocationAgentSessionPath(
      this.projectId,
      this.location,
      this.agent,
      this.sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: txt
        },
        languageCode: this.config.languageCode
      }
    };

    const responses = await this.sessionClient.detectIntent(request);

    logger.silly("got speech from api", { text: JSON.stringify(responses[0]) });

    if (
      !responses ||
      !responses[0].queryResult ||
      !responses[0].queryResult.responseMessages
    ) {
      throw new Error("got unexpect null intent");
    }

    const effects: Effect[] = this.getEffects(
      responses[0].queryResult.responseMessages as Record<string, any>[]
    );

    const ref = responses[0].queryResult.intent
      ? responses[0].queryResult.intent.displayName || "unknown"
      : "unknown";

    return {
      ref,
      effects,
      confidence: responses[0].queryResult.intentDetectionConfidence || 0,
      allRequiredParamsPresent: responses[0].queryResult.text ? true : false
    };
  }

  private getEffects(responseMessages: Record<string, any>[]): Effect[] {
    const effects: Effect[] = [];
    for (const r of responseMessages) {
      if (r.message === "text") {
        effects.push({
          type: "say",
          parameters: {
            response: r.text.text[0]
          }
        });
        continue;
      } else if (r.payload) {
        effects.push(transformPayloadToEffect(r.payload));
      }
    }
    return effects;
  }
}
