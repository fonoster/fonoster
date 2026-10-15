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
// Call statuses shared by the Calls API, the SDK and the CLI. The verb and stream types of the
// retired voice.proto are gone (cleanbreak CB-B1).

/** Progress of a dialed call, as the Calls API's trackCall reports it. */
enum DialStatus {
  TRYING = "TRYING",
  CANCEL = "CANCEL",
  ANSWER = "ANSWER",
  BUSY = "BUSY",
  PROGRESS = "PROGRESS",
  NOANSWER = "NOANSWER",
  FAILED = "FAILED"
}

/** Answering machine detection verdict (the amd classifier). */
enum AmdStatus {
  UNSPECIFIED = "AMD_STATUS_UNSPECIFIED",
  HUMAN = "HUMAN",
  MACHINE = "MACHINE",
  VOICEMAIL = "VOICEMAIL",
  IVR = "IVR",
  UNKNOWN = "UNKNOWN"
}

type Amd = {
  status: AmdStatus;
  confidence: number;
  detector: string;
  latencyMs: number;
};

export { Amd, AmdStatus, DialStatus };
