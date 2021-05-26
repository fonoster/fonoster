/* eslint-disable */
import {Secret} from "./protos/secrets_pb";

export default function (jsonObj: any): Secret {
  const secret = new Secret();
  secret.setSecretName(jsonObj.secretName);
  secret.setSecret(jsonObj.secret);
  return secret;
}
