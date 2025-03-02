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
import { GrpcErrorMessage } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";

const logger = getLogger({ service: "identity", filePath: __filename });

type GetPublicKeyResponse = {
  publicKey: string;
};

function createGetPublicKey(publicKey: string) {
  return async function getPublicKey(
    _: unknown,
    callback: (error: GrpcErrorMessage, response?: GetPublicKeyResponse) => void
  ) {
    logger.verbose("getting public key for JWT verification");

    callback(null, { publicKey });
  };
}

export { createGetPublicKey };
