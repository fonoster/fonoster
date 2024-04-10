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
import * as dialogflow from "@google-cloud/dialogflow";
import { IntentsEngine, Intent, DialogFlowESConfig } from "./types";
import { transformPayloadToEffect } from "./df_utils";
import { JsonObject, struct } from "pb-util";
import { Effect } from "../cerebro/types";
import { getLogger } from "@fonoster/logger";
import uuid = require("uuid");

const logger = getLogger({ service: "autopilot", filePath: __filename });

type FulfillmentMessage = {
  payload?: Record<string, unknown>;
  telephonySynthesizeSpeech?: Record<string, unknown>;
  telephonyTransferCall?: Record<string, unknown>;
  text?: Record<string, unknown>;
};

export default class DialogFlow implements IntentsEngine {
  sessionClient: dialogflow.v2beta1.SessionsClient;
  sessionPath: string;
  config: DialogFlowESConfig;
  sessionId: string;
  projectId: string;
  constructor(config: DialogFlowESConfig) {
    this.sessionId = uuid.v4();
    this.config = config;
    this.projectId = config.projectId;
    // Create a new session
    this.sessionClient = new dialogflow.v2beta1.SessionsClient({
      credentials: config.credentials
    });
    logger.verbose("created new dialogflow/es session", {
      projectId: this.projectId,
      sessionId: this.sessionId
    });
  }

  setProjectId(projectId: string) {
    this.projectId = projectId;
  }

  async findIntentWithEvent(name: string, payload?: Record<string, unknown>) {
    const request = {
      queryInput: {
        event: {
          name: name.toUpperCase(),
          languageCode: this.config.languageCode
        }
      }
    };

    return this.detectItent(request, payload);
  }

  async findIntent(
    txt: string,
    payload?: Record<string, unknown>
  ): Promise<Intent> {
    const request = {
      queryParams: {},
      queryInput: {
        text: {
          text: txt,
          languageCode: this.config.languageCode
        }
      }
    };

    return this.detectItent(request, payload);
  }

  private async detectItent(
    request: Record<string, unknown>,
    payload?: Record<string, unknown>
  ): Promise<Intent> {
    const sessionPath = this.sessionClient.projectAgentSessionPath(
      this.projectId,
      this.sessionId
    );

    request.session = sessionPath;

    if (payload) {
      request.queryParams = {
        payload: struct.encode(payload as JsonObject)
      };
    }

    const [response] = await this.sessionClient.detectIntent(request);

    logger.silly("got speech from api", { text: JSON.stringify(response) });

    if (!response.queryResult?.intent) {
      throw new Error("got unexpect null intent");
    }

    let effects: Effect[] = [];

    if (response.queryResult.fulfillmentMessages) {
      const messages = response.queryResult.fulfillmentMessages.filter(
        (f) => f.platform === this.config.platform
      );
      effects = this.getEffects(messages as Record<string, unknown>[]);
    } else if (response.queryResult.fulfillmentText) {
      effects = [
        {
          type: "say",
          parameters: {
            response: response.queryResult.fulfillmentText
          }
        }
      ];
    }

    return {
      ref: response.queryResult.intent.displayName || "unknown",
      effects,
      confidence: response.queryResult.intentDetectionConfidence || 0
    };
  }

  private getEffects(fulfillmentMessages: FulfillmentMessage[]): Effect[] {
    const effects: Effect[] = [];

    for (const f of fulfillmentMessages) {
      if (f.payload) {
        effects.push(transformPayloadToEffect(f.payload));
      } else if (f.telephonySynthesizeSpeech) {
        effects.push({
          type: "say",
          parameters: {
            response:
              f.telephonySynthesizeSpeech.text ||
              f.telephonySynthesizeSpeech.ssml
          }
        });
      } else if (f.telephonyTransferCall) {
        effects.push({
          type: "transfer",
          parameters: {
            destination: f.telephonyTransferCall.phoneNumber
          }
        });
      } else if (f.text) {
        effects.push({
          type: "say",
          parameters: {
            response: f.text.text[0]
          }
        });
      }
    }
    return effects;
  }
}
