/* eslint-disable */
const vault = require("node-vault")();

export default async function (secretName: string, accessKeyId: string) {
  await vault.auths();
  const roleId = (await vault.getApproleRoleId({role_name: accessKeyId})).data
    .role_id;
  const secretId = (await vault.getApproleRoleSecret({role_name: accessKeyId}))
    .data.secret_id;
  const token = (
    await vault.approleLogin({role_id: roleId, secret_id: secretId})
  ).auth.client_token;

  const entityId = (await vault.tokenLookupSelf({token: token})).data.entity_id;
  await vault.delete(`secret/data/${entityId}/` + secretName);
}
