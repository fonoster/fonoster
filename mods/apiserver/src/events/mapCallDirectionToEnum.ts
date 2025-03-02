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
import { CallDirection } from "@fonoster/types";

function mapCallDirectionToEnum(direction: string): CallDirection {
  switch (direction) {
    case "from-pstn":
      return CallDirection.FROM_PSTN;
    case "peer-to-pstn":
    case "agent-to-pstn":
      return CallDirection.TO_PSTN;
    case "agent-to-agent":
    case "agent-to-peer":
    case "peer-to-agent":
      return CallDirection.INTRA_NETWORK;
    default:
      throw new Error(`Invalid call direction: ${direction}`);
  }
}

export { mapCallDirectionToEnum };
