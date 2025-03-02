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
import { DialStatus } from "@fonoster/common";

const FailedStatus = ["CHANUNAVAIL", "CONGESTION"];

function mapDialStatus(status: string): DialStatus | undefined {
  if (status === "") {
    return DialStatus.TRYING;
  }

  const normalizedStatus = status.toUpperCase();
  const dialStatusArray = Object.keys(DialStatus).map((key) => DialStatus[key]);

  if (FailedStatus.includes(normalizedStatus)) {
    return DialStatus.FAILED;
  } else if (dialStatusArray.includes(normalizedStatus)) {
    return DialStatus[normalizedStatus];
  }
  // If the status is not in the DialStatus enum, return undefined
  return undefined;
}

export { mapDialStatus };
