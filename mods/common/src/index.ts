/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import APIClient from "./api_client";
import WebAPIClient from "./web_client";
import { ClientOptions, WebClientOptions } from "./types";
import { getClientCredentials, getServerCredentials } from "./trust_util";
import healthcheck from "./healthcheck";
import runServices from "./service_runner";
import { Plugin } from "./speech/plugin";
import {
  SpeechProvider,
  SpeechTracker,
  SpeechResult,
  StreamSpeechResult
} from "./speech/types";
export * as Tracer from "./tracer";

export {
  APIClient,
  WebAPIClient,
  WebClientOptions,
  ClientOptions,
  Plugin,
  SpeechTracker,
  SpeechResult,
  SpeechProvider,
  StreamSpeechResult,
  getClientCredentials,
  getServerCredentials,
  runServices,
  healthcheck
};
