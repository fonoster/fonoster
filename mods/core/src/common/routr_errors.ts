import { FonosterError } from "@fonoster/errors";
import {
  FonosterAuthError,
  FonosterFailedPrecondition,
  FonosterInvalidArgument
} from "@fonoster/errors";
import { status as Status } from "@grpc/grpc-js";

export default function (error: any) {
  if (!error.response) throw new FonosterError(error);

  const message = error.response.data.message;

  switch (error.response.status) {
    case 409:
      throw new FonosterFailedPrecondition(message);
    case 401:
      throw new FonosterAuthError(message);
    case 422:
      throw new FonosterFailedPrecondition(message);
    case 404:
      throw new FonosterError(message, Status.NOT_FOUND);
    case 400:
      throw new FonosterInvalidArgument(message);
    default:
      throw new FonosterError(message);
  }
}
