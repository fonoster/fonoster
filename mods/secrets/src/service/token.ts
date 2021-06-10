/* eslint-disable */
export default async function (accessKeyId: string) {
  const vault = require("node-vault")();
  const roleId = (await vault.getApproleRoleId({role_name: accessKeyId})).data
    .role_id;
  const secretId = (await vault.getApproleRoleSecret({role_name: accessKeyId}))
    .data.secret_id;
  const token = (
    await vault.approleLogin({role_id: roleId, secret_id: secretId})
  ).auth.client_token;
  const entityId = (await vault.tokenLookupSelf({token: token})).data.entity_id;
  return entityId;
}
