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
import { ServingStatus } from "grpc-health-check";

if (process.env.NODE_ENV === "dev") {
  dotenv.config({ path: join(__dirname, "..", "..", "..", ".env") });
}

const e = process.env;

assertEnvsAreSet(["CLOAK_ENCRYPTION_KEY"]);

export const CLOAK_ENCRYPTION_KEY = e.CLOAK_ENCRYPTION_KEY;
export const ROUTR_API_ENDPOINT = e.ROUTR_API_ENDPOINT || "localhost:51908";
export const ROUTR_DEFAULT_PEER_NAME =
  e.ROUTR_DEFAULT_PEER_NAME || "Voice Autopilot";
export const ROUTR_DEFAULT_PEER_USERNAME =
  e.ROUTR_DEFAULT_PEER_USERNAME || "voice";
export const ROUTR_DEFAULT_PEER_AOR =
  e.ROUTR_DEFAULT_PEER_AOR || "sip:voice@default";
export const ROUTR_DEFAULT_PEER_PASSWORD =
  e.ROUTR_DEFAULT_PEER_PASSWORD || "changeme";
export const APISERVER_BIND_ADDR = "0.0.0.0:50051";
export const GRPC_SERVING_STATUS = "SERVING" as ServingStatus;
export const GRPC_NOT_SERVING_STATUS = "NOT_SERVING" as ServingStatus;
export const OWNER_NAME = e.OWNER_NAME || "Admin";
export const OWNER_ACCESS_KEY_ID = e.OWNER_ACCESS_KEY_ID
  ? e.OWNER_ACCESS_KEY_ID
  : "US14wj8q6qlirw331gfswusfblie6h78uz";
export const OWNER_EMAIL = e.OWNER_EMAIL;
export const OWNER_PASSWORD = e.OWNER_PASSWORD || "changeme";
export const OWNER_ID = e.OWNER_ID || "635c0cd8-8125-483d-b467-05c53ce2cd31";
