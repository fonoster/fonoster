/* eslint-disable */
import {Secret} from "./protos/secrets_pb";
import tokenParser from "./json_parser";
const vault = require("node-vault")();

export default async function (
  secretName: string,
  accessKeyId: string
): Promise<Secret> {
  await vault.auths();
  const roleId = (await vault.getApproleRoleId({role_name: accessKeyId})).data
    .role_id;
  const secretId = (await vault.getApproleRoleSecret({role_name: accessKeyId}))
    .data.secret_id;
  const token = (
    await vault.approleLogin({role_id: roleId, secret_id: secretId})
  ).auth.client_token;

  const entityId = (await vault.tokenLookupSelf({token: token})).data.entity_id;
  const secretFromVault = await vault.read(
    `secret/data/${entityId}/` + secretName
  );

  return tokenParser({secret: secretFromVault.data.data.value});
}
