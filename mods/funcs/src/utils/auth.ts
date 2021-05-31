import {Jwt, AuthUtils} from "@fonos/auth";
import {getSalt, AUTH_ISS} from "@fonos/certs";

// Obtains a set of credentials for the docker image
// TODO: Role should be a constant somewhere
export default async function (accesKeyId: string) {
  const auth = new AuthUtils(new Jwt());
  const token = await auth.createToken(
    accesKeyId,
    AUTH_ISS,
    "FUNCTION",
    getSalt()
  );
  return token.accessToken;
}
