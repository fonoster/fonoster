import {FonosService, ServiceOptions} from "@fonos/core";
import {SecretsClient} from "../service/protos/secrets_grpc_pb";
import SecretPB from "../service/protos/secrets_pb";
import CommonPB from "../service/protos/common_pb";
import {promisifyAll} from "grpc-promise";
import grpc from "grpc";
import {Secret, CreateSecretRequest} from "../types";

/**
 * @classdesc Use Fonos UserManager, a capability of Fonos Systems Manager,
 * to create and manage users and roles. Fonos UserManager requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require('@fonos/sdk')
 * const users = new Fonos.UserManager()
 *
 * TODO: Adde example
 */
export default class Secrets extends FonosService {
  /**
   * Constructs a new AppManager Object.
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
   * Creates a new Domain on the SIP Proxy subsystem.
   *
   * @param {CreateSecretRequest} request - Request for the provision of
   * a new Secret
   * @param {string} request.secretName - Friendly name for the Secret
   * @param {string} request.secret - secret to be save
   * @return {Promise<Secrets>}
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
  async createSecret(request: CreateSecretRequest): Promise<Secret> {
    const secret = new SecretPB.Secret();
    secret.setSecretName(request.secretName);
    secret.setSecret(request.secret);

    const req = new SecretPB.CreateSecretRequest();
    req.setSecret(secret);

    const secretFromDatabase = await super
      .getService()
      .createUser()
      .sendMessage(req);

    return {
      secretName: secretFromDatabase.getSecretName(),
      secret: secretFromDatabase.getSecret()
    };
  }

  /**
   * Retrives a Secret by its reference.
   *
   * @param {string} secretName - Reference to Secret
   * @return {Promise<Secrets>} The domain
   * @example
   *
   * const ref = "Jenkins";
   *
   * secrets.getSecret(ref)
   * .then(result => {
   *   console.log(result) // returns the CreateGetResponse interface
   * }).catch(e => console.error(e)); // an error occurred
   */
  async getSecret(secretName: string): Promise<Secret> {
    const request = new SecretPB.GetSecretResponse();
    request.setSecretName(secretName);

    const res = await super.getService().getSecret().sendMessage(request);

    return {
      secretName: res.getSecretName(),
      secret: res.getSecret()
    };
  }
}

export {SecretPB, CommonPB};
