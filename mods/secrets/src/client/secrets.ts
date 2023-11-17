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
import { APIClient, ClientOptions } from "@fonoster/common";
import { SecretsClient } from "../service/protos/secrets_grpc_pb";
import SecretPB from "../service/protos/secrets_pb";
import CommonPB from "../service/protos/common_pb";
import { promisifyAll } from "grpc-promise";
import {
  CreateSecretRequest,
  CreateSecretResponse,
  GetSecretResponse,
  ISecretsClient,
  ListSecretsRequest,
  ListSecretsResponse,
  Secret
} from "./types";

/**
 * @classdesc Use Fonoster Secrets, a capability of Fonoster Secrets Service,
 * to create and manage your secrets. Fonoster Secrets requires of a
 * running Fonoster deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/sdk")
 * const secrets = new Fonoster.Secrets()
 *
 * const request = {
 *    secretName: "my-secret",
 *    secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
 * };
 *
 * secrets.createSecret(request)
 * .then(result => {
 *   console.log(result) // message with the CreateSecretResponse interface
 * }).catch(e => console.error(e)); // an error occurred
 */
export default class Secrets extends APIClient implements ISecretsClient {
  /**
   * Constructs a Secrets Object.
   *
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(SecretsClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Creates and stores a new secret.
   *
   * @param {CreateSecretRequest} request - Request to create a new secret
   * @param {string} request.name - Friendly name for the secret
   * @param {string} request.secret - Actual secret
   * @return {Promise<CreateSecretResponse>}
   * @example
   *
   * const request = {
   *    name: "my-secret",
   *    secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
   * };
   *
   * secrets.createSecret(request)
   * .then(result => {
   *   console.log(result) // returns the CreateDomainResponse interface
   * }).catch(e => console.error(e)); // an error occurred
   */
  async createSecret(
    request: CreateSecretRequest
  ): Promise<CreateSecretResponse> {
    const secret = new SecretPB.Secret();
    secret.setName(request.name);
    secret.setSecret(request.secret);

    const req = new SecretPB.CreateSecretRequest();
    req.setName(secret.getName());
    req.setSecret(secret.getSecret());

    const secretFromVault = await super
      .getService()
      .createSecret()
      .sendMessage(req);

    return {
      name: secretFromVault.getName()
    };
  }

  /**
   * Gets a secret by name.
   *
   * @param {CreateSecretRequest} request - Request to create a new Secret
   * @param {string} request.name - Friendly name for the Secret
   * @param {string} request.secret - Secret to save
   * @return {Promise<CreateSecretResponse>}
   * @example
   *
   * const request = {
   *    name: "my-secret",
   *    secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
   * };
   *
   * secrets.createSecret(request)
   * .then(result => {
   *   console.log(result) // returns the GetSecretResponse interface
   * }).catch(e => console.error(e)); // an error occurred
   */
  async getSecret(name: string): Promise<GetSecretResponse> {
    const req = new SecretPB.GetSecretRequest();
    req.setName(name);

    const secretFromVault = await super
      .getService()
      .getSecret()
      .sendMessage(req);

    return {
      name: secretFromVault.getName(),
      secret: secretFromVault.getSecret()
    };
  }

  /**
   * List all the secrets for current Project.
   *
   * @param {ListSecretRequest} request - Request for the provision of
   * a new Secret
   * @param {string} request.name - Friendly name for the Secret
   * @param {string} request.secret - secret to be save
   * @return {Promise<ListSecretResponse>}
   * @example
   *
   * const request = {
   *    pageSize: 1,
   *    pageToken: 1
   * };
   *
   * secrets.listSecrets(request)
   * .then(result => {
   *   console.log(result)
   * }).catch(e => console.error(e)); // an error occurred
   */
  async listSecrets(request: ListSecretsRequest): Promise<ListSecretsResponse> {
    const req = new SecretPB.ListSecretsIdRequest();
    req.setPageSize(request.pageSize);
    req.setPageToken(request.pageToken);
    const paginatedList = await this.getService()
      .listSecretsId()
      .sendMessage(req);

    return {
      nextPageToken: paginatedList.getNextPageToken(),
      secrets: paginatedList.getSecretsList().map((name: string) => {
        return {
          name
        };
      })
    };
  }

  /**
   * Removes a secret by name.
   *
   * @param {string} name - Secret name
   * @example
   *
   * secrets.deleteSecret("my-secret")
   * .then(() => {
   *   console.log("successful")
   * }).catch(e => console.error(e)); // an error occurred
   */
  async deleteSecret(name: string): Promise<void> {
    const req = new SecretPB.DeleteSecretRequest();
    req.setName(name);
    await super.getService().deleteSecret().sendMessage(req);
  }
}

export { Secret, SecretPB, CommonPB, ISecretsClient };

// WARNING: Workaround for support to commonjs clients
module.exports = Secrets;
module.exports.SecretPB = SecretPB;
module.exports.CommonPB = CommonPB;
