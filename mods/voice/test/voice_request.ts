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
import { VoiceRequest } from "../src/types";

export const voiceRequest: VoiceRequest = {
  accessKeyId: "603693c0afaa1a080000000c",
  sessionToken:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmb25vcyIsInJv...",
  sessionId: "1622916892.122",
  dialbackEnpoint: "http://localhost:8088",
  number: "17853178070",
  callerId: "John Doe",
  callerNumber: "19103178070",
  selfEndpoint: "http://localhost:3000/voiceapp"
};
