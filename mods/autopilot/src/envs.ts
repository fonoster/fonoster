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
import { join } from "path";
import { assertEnvsAreSet, assertFileExists } from "@fonoster/common";
import logger from "@fonoster/logger";
import dotenv from "dotenv";
import { ConversationProvider } from "./types";

if (process.env.NODE_ENV === "dev") {
  dotenv.config({ path: join(__dirname, "..", "..", "..", ".env") });
}

const e = process.env;

export const AWS_S3_ACCESS_KEY_ID = e.AUTOPILOT_AWS_S3_ACCESS_KEY_ID ?? "";
export const AWS_S3_ENDPOINT = e.AUTOPILOT_AWS_S3_ENDPOINT || undefined;
export const AWS_S3_REGION = e.AUTOPILOT_AWS_S3_REGION ?? "us-east-1";
export const AWS_S3_SECRET_ACCESS_KEY =
  e.AUTOPILOT_AWS_S3_SECRET_ACCESS_KEY ?? "";
export const KNOWLEDGE_BASE_ENABLED =
  e.AUTOPILOT_KNOWLEDGE_BASE_ENABLED === "true";
export const NODE_ENV = e.NODE_ENV || "production";
export const UNSTRUCTURED_API_KEY = e.AUTOPILOT_UNSTRUCTURED_API_KEY ?? "";
export const UNSTRUCTURED_API_URL =
  e.AUTOPILOT_UNSTRUCTURED_API_URL ??
  "https://api.unstructuredapp.io/general/v0/general";
export const CONVERSATION_PROVIDER = e.AUTOPILOT_CONVERSATION_PROVIDER
  ? e.AUTOPILOT_CONVERSATION_PROVIDER
  : ConversationProvider.FILE;
export const CONVERSATION_PROVIDER_FILE = e.AUTOPILOT_CONVERSATION_PROVIDER_FILE
  ? e.AUTOPILOT_CONVERSATION_PROVIDER_FILE
  : `${process.cwd()}/config/assistant.json`;
export const APISERVER_ENDPOINT = e.AUTOPILOT_APISERVER_ENDPOINT
  ? e.AUTOPILOT_APISERVER_ENDPOINT
  : "apiserver:50051";
export const INTEGRATIONS_FILE = e.AUTOPILOT_INTEGRATIONS_FILE
  ? e.AUTOPILOT_INTEGRATIONS_FILE
  : "/opt/fonoster/integrations.json";
export const OPENAI_API_KEY = e.AUTOPILOT_OPENAI_API_KEY;
export const SKIP_IDENTITY = e.AUTOPILOT_SKIP_IDENTITY === "true";

if (
  CONVERSATION_PROVIDER!.toLocaleLowerCase() !== ConversationProvider.API &&
  CONVERSATION_PROVIDER!.toLocaleLowerCase() !== ConversationProvider.FILE
) {
  console.error("CONVERSATION_PROVIDER must be set to 'api' or 'file'");
  process.exit(1);
}

if (CONVERSATION_PROVIDER!.toLocaleLowerCase() === ConversationProvider.API) {
  assertFileExists(INTEGRATIONS_FILE);
}

if (KNOWLEDGE_BASE_ENABLED) {
  assertEnvsAreSet([
    "AUTOPILOT_AWS_S3_ACCESS_KEY_ID",
    "AUTOPILOT_AWS_S3_SECRET_ACCESS_KEY",
    "AUTOPILOT_UNSTRUCTURED_API_KEY"
  ]);

  if (!AWS_S3_ENDPOINT && !AWS_S3_REGION) {
    logger.error(
      "Knowledge base configuration error: Either AUTOPILOT_AWS_S3_ENDPOINT or AUTOPILOT_AWS_S3_REGION must be set when using AWS S3"
    );
    process.exit(1);
  }
}
