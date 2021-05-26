/* eslint-disable */
import grpc from "grpc";
import getSecret from "./get_secret";
import createSecret from "./create_secret";
import deleteSecret from "./delete_secret";
import {
  Secret,
  ListSecretsIdRequest,
  ListSecretsIdResponse,
  GetSecretRequest,
  CreateSecretRequest,
  DeleteSecretRequest
} from "./protos/secrets_pb";
import {Empty} from "./protos/common_pb";
import {getAccessKeyId} from "@fonos/core";
import {
  ISecretsService,
  SecretsService,
  ISecretsServer
} from "./protos/secrets_grpc_pb";

class SecretServer implements ISecretsServer {
  async listSecretsId(
    call: grpc.ServerUnaryCall<ListSecretsIdRequest>,
    callback: grpc.sendUnaryData<ListSecretsIdResponse>
  ) {
    // try {
    //   const result = await listUsers(
    //     parseInt(call.request.getPageToken()),
    //     call.request.getPageSize()
    //   );
    //   const response = new ListUsersResponse();
    //   response.setUsersList(result.users);
    //   if (result.pageToken) response.setNextPageToken("" + result.pageToken);
    //   callback(null, response);
    // } catch (e) {
    //   callback(e, null);
    // }
  }

  async getSecret(
    call: grpc.ServerUnaryCall<GetSecretRequest>,
    callback: grpc.sendUnaryData<Secret>
  ) {
    try {
      const secretName = call.request.getSecretName();
      const accessKeyId = getAccessKeyId(call);
      const data = await getSecret(secretName, accessKeyId);
      callback(null, data);
    } catch (e) {
      callback(e, null);
    }
  }

  async createSecret(
    call: grpc.ServerUnaryCall<CreateSecretRequest>,
    callback: grpc.sendUnaryData<Secret>
  ) {
    try {
      const secretObj = call.request.getSecret();
      const accessKeyId = getAccessKeyId(call);
      const data = await createSecret(
        secretObj.getSecretName(),
        secretObj.getSecret(),
        accessKeyId
      );
      callback(null, data);
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteSecret(
    call: grpc.ServerUnaryCall<DeleteSecretRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      const secretObj = call.request.getSecret();
      await deleteSecret(secretObj.getSecretName(), getAccessKeyId(call));
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export {SecretServer as default, ISecretsService, SecretsService};
