#!/usr/bin/env node

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
import { configureLogger } from "@fonoster/logger";
import { CONVERSATION_PROVIDER, LOGS, NODE_ENV, SKIP_IDENTITY } from "./envs";
import { loadIntegrations } from "./integrations";
import { ConversationProvider } from "./types";
import { startVoiceServer } from "./voiceServerSetup";

// Loggers created while the imports above ran switch to autopilot.yaml's
// settings here.
configureLogger(LOGS);

// Fail at boot, not on the first call, if the integrations file is unusable.
// Only assistants loaded from the API server need it.
if (CONVERSATION_PROVIDER === ConversationProvider.API) {
  loadIntegrations();
}

const skipIdentity = NODE_ENV === "development" || SKIP_IDENTITY;

startVoiceServer(skipIdentity);
