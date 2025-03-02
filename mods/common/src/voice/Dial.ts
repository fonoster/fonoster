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
import { VerbRequest } from "./Verb";

enum DialRecordDirection {
  IN = "IN",
  OUT = "OUT",
  BOTH = "BOTH"
}

enum DialStatus {
  TRYING = "TRYING",
  CANCEL = "CANCEL",
  ANSWER = "ANSWER",
  BUSY = "BUSY",
  PROGRESS = "PROGRESS",
  NOANSWER = "NOANSWER",
  // Maps from Asterisk's CHANUNAVAIL and CONGESTION
  FAILED = "FAILED"
}

type DialOptions = {
  timeout?: number;
  recordDirection?: DialRecordDirection;
};

type DialRequest = VerbRequest &
  DialOptions & {
    destination: string;
  };

export { DialOptions, DialRecordDirection, DialRequest, DialStatus };
