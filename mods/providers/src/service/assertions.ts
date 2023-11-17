import { FonosterInvalidArgument } from "@fonoster/errors";
import isValidHost from "is-valid-host";

export const assertIsValidHost = (host: string) => {
  if (!isValidHost(host)) {
    throw new FonosterInvalidArgument(`invalid host: ${host}`);
  }
};
