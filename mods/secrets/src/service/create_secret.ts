/* eslint-disable */
import {CreateSecretResponse} from "./protos/secrets_pb";
import getUserToken from "./token";

export default async function (
  name: string,
  secret: string,
  accessKeyId: string
): Promise<CreateSecretResponse> {
  const vault = require("node-vault")();
  const entityId = await getUserToken(accessKeyId);
  await vault.write(`secret/data/${entityId}/${name}`, {
    data: {value: secret}
  });
  const response = new CreateSecretResponse();
  response.setName(name);
  return response;
}
