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
import * as grpc from "@grpc/grpc-js";
import { createServiceDefinition } from "../utils";

type GetPublicKeyResponse = {
  publicKey: string;
};

const IdentityServiceClient = grpc.makeGenericClientConstructor(
  createServiceDefinition({
    serviceName: "Identity",
    pckg: "identity",
    proto: "identity.proto",
    version: "v1beta2"
  }),
  "",
  {}
);

function getPublicKey(endpoint: string, allowInsecure: boolean = false) {
  return new Promise<GetPublicKeyResponse>((resolve, reject) => {
    const client = new IdentityServiceClient(
      endpoint,
      allowInsecure
        ? grpc.credentials.createInsecure()
        : grpc.credentials.createSsl()
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

export { getPublicKey };
