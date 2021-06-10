import {FonosService, ServiceOptions} from "@fonos/common";
import {SecretsClient} from "../service/protos/secrets_grpc_pb";
import SecretPB from "../service/protos/secrets_pb";
import CommonPB from "../service/protos/common_pb";
import {promisifyAll} from "grpc-promise";
import grpc from "grpc";
import {
  CreateSecretRequest,
  CreateSecretResponse,
  DeleteSecretRequest
} from "../types";

/**
 * @classdesc Use Fonos Secret, a capability of Fonos Systems Manager,
 * to create and manage users and roles. Fonos UserManager requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require('@fonos/sdk')
 * const secrets = new Fonos.Secret()
 *
 * TODO: Adde example
 */
export default class Secrets extends FonosService {
  /**
   * Constructs a Secret Object.
   *
   * @param {ServiceOptions} options - Options to indicate the objects endpoint
   * @see module:core:FonosService
   */
  constructor(options?: ServiceOptions) {
    super(SecretsClient, options);
    super.init(grpc);
    promisifyAll(super.getService(), {metadata: super.getMeta()});
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
   * Retrives a Secret by its reference.
   *
   * @param {string} request - Reference to Secret
   * @return {Promise<void>} The domain
   * @example
   *
   * const request = {
   *  name: "Jenkins"
   * };
   *
   * secrets.deleteSecret(request)
   * .then(() => {
   *   console.log("successful") // returns the CreateGetResponse interface
   * }).catch(e => console.error(e)); // an error occurred
   */
  async deleteSecret(request: DeleteSecretRequest): Promise<void> {
    const req = new SecretPB.DeleteSecretRequest();
    req.setName(request.name.toString());
    await super.getService().deleteSecret().sendMessage(req);
  }
}

export {SecretPB, CommonPB};
