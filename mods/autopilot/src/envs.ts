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
import { join } from "path";
import { assertEnvsAreSet } from "@fonoster/common";
import dotenv from "dotenv";

if (process.env.NODE_ENV === "dev") {
  dotenv.config({ path: join(__dirname, "..", "..", "..", ".env") });
}

const e = process.env;

export const AWS_S3_ACCESS_KEY_ID = e.AWS_S3_ACCESS_KEY_ID;
export const AWS_S3_ENDPOINT = e.AWS_S3_ENDPOINT;
export const AWS_S3_REGION = e.AWS_S3_REGION ?? "us-east-1";
export const AWS_S3_SECRET_ACCESS_KEY = e.AWS_S3_SECRET_ACCESS_KEY;
export const KNOWLEDGE_BASE_ENABLED = e.KNOWLEDGE_BASE_ENABLED === "true";
export const NODE_ENV = e.NODE_ENV || "production";
export const SKIP_IDENTITY = e.SKIP_IDENTITY === "true";
export const UNSTRUCTURED_API_KEY = e.UNSTRUCTURED_API_KEY;
export const UNSTRUCTURED_API_URL =
  e.UNSTRUCTURED_API_URL ?? "https://api.unstructuredapp.io/general/v0/general";
export const SILERO_VAD_MODEL_PATH =
  e.SILERO_VAD_MODEL_PATH ?? join(__dirname, "..", "silero_vad.onnx");

if (KNOWLEDGE_BASE_ENABLED) {
  assertEnvsAreSet([
    "AWS_S3_ACCESS_KEY_ID",
    "AWS_S3_SECRET_ACCESS_KEY",
    "UNSTRUCTURED_API_KEY"
  ]);
}
