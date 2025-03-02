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
import { STASIS_APP_NAME } from "@fonoster/common";
import { v4 as uuidv4 } from "uuid";
import { APISERVER_HOST } from "../../envs";

function createExternalMediaConfig(port: number) {
  return {
    app: STASIS_APP_NAME,
    external_host: `${APISERVER_HOST}:${port}`,
    format: "slin16",
    transport: "tcp",
    data: uuidv4(),
    encapsulation: "audiosocket",
    variables: {
      FROM_EXTERNAL_MEDIA: "true"
    }
  };
}

export { createExternalMediaConfig };
