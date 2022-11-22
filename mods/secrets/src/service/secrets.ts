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
import grpc from "@grpc/grpc-js";
import getSecret from "./get_secret";
import createSecret from "./create_secret";
import deleteSecret from "./delete_secret";
import listSecret from "./list_secret";
import {
  GetSecretRequest,
  CreateSecretRequest,
  DeleteSecretRequest,
  ListSecretsIdRequest,
  ListSecretsIdResponse,
  Secret
} from "./protos/secrets_pb";
import { Empty } from "./protos/common_pb";
import { getAccessKeyId } from "@fonoster/core";
import {
  ISecretsService,
  SecretsService,
  ISecretsServer
} from "./protos/secrets_grpc_pb";

class SecretServer implements ISecretsServer {
  [name: string]: grpc.UntypedHandleCall;
  async listSecretsId(
    call: grpc.ServerUnaryCall<ListSecretsIdRequest, ListSecretsIdResponse>,
    callback: grpc.sendUnaryData<ListSecretsIdResponse>
  ) {
    try {
      const result = await listSecret(
        parseInt(call.request.getPageToken()),
        call.request.getPageSize(),
        getAccessKeyId(call)
      );

      const response = new ListSecretsIdResponse();
      response.setSecretsList(result.secrets);

      if (result.pageToken) response.setNextPageToken("" + result.pageToken);
      callback(null, response);
    } catch (e) {
      if (e?.response?.statusCode === 404) {
        const response = new ListSecretsIdResponse();
        response.setSecretsList([]);
        callback(null, response);
      } else {
        callback(e, null);
      }
    }
  }

  async getSecret(
    call: grpc.ServerUnaryCall<GetSecretRequest, Secret>,
    callback: grpc.sendUnaryData<Secret>
  ) {
    try {
      const name = call.request.getName();
      const accessKeyId = getAccessKeyId(call);
      const data = await getSecret(name, accessKeyId);
      callback(null, data);
    } catch (e) {
      callback(e, null);
    }
  }

  async createSecret(
    call: grpc.ServerUnaryCall<CreateSecretRequest, Secret>,
    callback: grpc.sendUnaryData<Secret>
  ) {
    try {
      const name = call.request.getName();
      const secret = call.request.getSecret();
      const accessKeyId = getAccessKeyId(call);
      const data = await createSecret(name, secret, accessKeyId);
      callback(null, data);
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteSecret(
    call: grpc.ServerUnaryCall<DeleteSecretRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      await deleteSecret(call.request.getName(), getAccessKeyId(call));
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export { SecretServer as default, ISecretsService, SecretsService };
