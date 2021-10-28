/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import {APIClient, ClientOptions} from "@fonos/common";
import {SecretsClient} from "../service/protos/secrets_grpc_pb";
import SecretPB from "../service/protos/secrets_pb";
import CommonPB from "../service/protos/common_pb";
import {promisifyAll} from "grpc-promise";
import {
  CreateSecretRequest,
  CreateSecretResponse,
  GetSecretResponse,
  ISecretsClient,
  ListSecretsRequest,
  ListSecretsResponse
} from "./types";

/**
 * @classdesc Use Fonos Secrets, a capability of Fonos Secrets Service,
 * to create and manage your secrets. Fonos Secrets requires of a
 * running Fonos deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonos = require("@fonos/sdk")
 * const secrets = new Fonos.Secrets()
 *
 * const request = {
 *    secretName: "Jenkins",
 *    secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
 * };
 *
 * secrets.createSecret(request)
 * .then(result => {
 *   console.log(result) // returns the CreateDomainResponse interface
 * }).catch(e => console.error(e)); // an error occurred
 */
export default class Secrets extends APIClient implements ISecretsClient {
  /**
   * Constructs a Secret Object.
   *
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(SecretsClient, options);
    super.init();
    promisifyAll(super.getService(), {metadata: super.getMeta()});
  }

  listSecrets(request: ListSecretsRequest): Promise<ListSecretsResponse> {
    throw new Error("Method not implemented.");
  }

  /**
   * Creates a new Secret.
   *
   * @param {CreateSecretRequest} request - Request for the provision of
   * a new Secret
   * @param {string} request.name - Friendly name for the Secret
   * @param {string} request.secret - secret to be save
   * @return {Promise<CreateSecretResponse>}
   * @example
   *
   * const request = {
   *    secretName: "Jenkins",
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
   * Get a Secret.
   *
   * @param {CreateSecretRequest} request - Request for the provision of
   * a new Secret
   * @param {string} request.name - Friendly name for the Secret
   * @param {string} request.secret - secret to be save
   * @return {Promise<CreateSecretResponse>}
   * @example
   *
   * const request = {
   *    secretName: "Jenkins",
   *    secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
   * };
   *
   * secrets.createSecret(request)
   * .then(result => {
   *   console.log(result) // returns the CreateDomainResponse interface
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
   * List all user secrets.
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
   * secrets.listSecret(request)
   * .then(result => {
   *   console.log(result) // returns the CreateDomainResponse interface
   * }).catch(e => console.error(e)); // an error occurred
   */
  async listSecret(request: ListSecretsRequest): Promise<ListSecretsResponse> {
    const req = new SecretPB.ListSecretIdRequest();
    req.setPageSize(request.pageSize);
    req.setPageToken(request.pageToken);
    const paginatedList = await this.getService()
      .listSecretsId()
      .sendMessage(req);

    return {
      nextPageToken: paginatedList.getNextPageToken(),
      secrets: paginatedList.getSecretsList().map((secret: SecretPB.Secret) => {
        return {
          name: secret.getName()
        };
      })
    };
  }

  /**
   * Retrives a Secret using its reference.
   *
   * @param {string} request - Reference to Secret
   * @return {Promise<void>} The domain
   * @example
   *
   * secrets.deleteSecret("jenkins")
   * .then(() => {
   *   console.log("successful")      // returns the CreateGetResponse interface
   * }).catch(e => console.error(e)); // an error occurred
   */
  async deleteSecret(name: string): Promise<void> {
    const req = new SecretPB.DeleteSecretRequest();
    req.setName(name);
    await super.getService().deleteSecret().sendMessage(req);
  }
}

export {SecretPB, CommonPB, ISecretsClient};

// WARNING: Workaround for support to commonjs clients
module.exports = Secrets;
module.exports.SecretPB = SecretPB;
module.exports.CommonPB = CommonPB;
