/* eslint-disable */
process.env.DEBUG = "node-vault"; // switch on debug mode
process.env.VAULT_ADDR = "http://api.fonoster.net:8200";
process.env.VAULT_TOKEN = "s.azgXnZcyTMYqG6S0vCGBrAF0";

import {Secret} from "./protos/secrets_pb";
const vault = require("node-vault")();
require("dotenv").config();

export default async function (accessKeyId: string): Promise<Secret> {
  try {
    await vault.auths();
    await vault.addApproleRole({
      role_name: accessKeyId,
      policies: "dev-policy, test-policy"
    });
    const rol = await Promise.all([
      vault.getApproleRoleId({role_name: accessKeyId}),
      vault.getApproleRoleSecret({role_name: ""})
    ]);
    const roleId = rol[0].data.role_id;
    const secretId = rol[1].data.secret_id;
    const result = await vault.approleLogin({
      role_id: roleId,
      secret_id: secretId
    });
    return result.auth.client_token;
  } catch (err) {
    console.error(err.message);
  }
}
