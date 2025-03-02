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
import { customAlphabet } from "nanoid";

enum AccessKeyIdType {
  USER,
  WORKSPACE,
  SERVICE,
  API_KEY
}

function generateAccessKeyId(type: AccessKeyIdType) {
  const prefix = {
    [AccessKeyIdType.USER]: "US",
    [AccessKeyIdType.WORKSPACE]: "WO",
    [AccessKeyIdType.SERVICE]: "SE",
    [AccessKeyIdType.API_KEY]: "AP"
  };

  return `${prefix[type]}${customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 32)()}`;
}

export { AccessKeyIdType, generateAccessKeyId };
