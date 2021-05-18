import Auth, {Jwt} from "@fonos/auth";
import {getSalt} from "@fonos/certs";

// Obtains a set of credentials for the docker image
// TODO: Role should be a constant somewhere
// TODO: The issuer should be a constant somwehere
export default async function (accesKeyId: string) {
    const auth = new Auth(new Jwt());
    const token = await auth.createTokens(accesKeyId, 'fonos', "FUNCTION", getSalt());
    return token.accessToken;
}