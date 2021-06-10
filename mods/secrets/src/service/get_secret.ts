/* eslint-disable */
import {GetSecretResponse, Secret} from "./protos/secrets_pb";
import getUserToken from "./token";

export default async function (
  name: string,
  accessKeyId: string
): Promise<GetSecretResponse> {
  const vault = require("node-vault")();
  const entityId = await getUserToken(accessKeyId);
  const secretFromVault = await vault.read(`secret/data/${entityId}/` + name);
  const response = new GetSecretResponse();
  response.setSecret(secretFromVault.data.data.value);
  response.setName(name);
  return response;
}
