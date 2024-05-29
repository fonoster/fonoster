/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { createServiceDefiniton } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { serviceDefinitionParams } from "./service";

type GetPublicKeyResponse = {
  publicKey: string;
};

const VoiceServiceClient = grpc.makeGenericClientConstructor(
  createServiceDefiniton(serviceDefinitionParams),
  "",
  {}
);

function getPublicKeyClient(endpoint: string) {
  return new Promise<GetPublicKeyResponse>((resolve, reject) => {
    const client = new VoiceServiceClient(
      endpoint,
      grpc.credentials.createInsecure()
    );

    client.getPublicKey(
      {},
      (error: grpc.ServiceError, response: GetPublicKeyResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      }
    );
  });
}

export { getPublicKeyClient };
