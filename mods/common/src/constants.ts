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
import { ServingStatus } from "grpc-health-check";

export const GRPC_NOT_SERVING_STATUS = "NOT_SERVING" as ServingStatus;
export const GRPC_SERVING_STATUS = "SERVING" as ServingStatus;
export const STASIS_APP_NAME = "mediacontroller";
export const CALL_CONTEXT = "local-ctx-common";
export const CALL_EXTENSION = "start";
export const CALL_DETAIL_RECORD_MEASUREMENT = "cdr";
export const INFLUXDB_CALLS_BUCKET = "calls";
export const APP_REF_HEADER = "x-app-ref";
export const ROUTR_DEFAULT_PEER_AOR = "sip:voice@default";
export const AUTOPILOT_SPECIAL_LOCAL_ADDRESS = "autopilot.fonoster.local";
export const AUTOPILOT_INTERNAL_ADDRESS = "autopilot:50061";
export const WELCOME_DEMO_SPECIAL_LOCAL_ADDRESS = "welcome.demo.fonoster.local";
