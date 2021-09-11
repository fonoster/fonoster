import {FonosError} from "@fonos/errors";
import {
  FonosAuthError,
  FonosFailedPrecondition,
  FonosInvalidArgument
} from "@fonos/errors";
import {status as Status} from "@grpc/grpc-js";

export default function (error: any) {
  if (!error.response) throw new FonosError(error);

  const message = error.response.data.message;

  switch (error.response.status) {
    case 409:
      throw new FonosFailedPrecondition(message);
    case 401:
      throw new FonosAuthError(message);
    case 422:
      throw new FonosFailedPrecondition(message);
    case 404:
      throw new FonosError(message, Status.NOT_FOUND);
    case 400:
      throw new FonosInvalidArgument(message);
    default:
      throw new FonosError(message);
  }
}
