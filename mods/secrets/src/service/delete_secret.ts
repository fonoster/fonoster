/* eslint-disable */
import getUserToken from "./token";

export default async function (name: string, accessKeyId: string) {
  const vault = require("node-vault")();
  const entityId = await getUserToken(accessKeyId);
  await vault.delete(`secret/data/${entityId}/` + name);
}
