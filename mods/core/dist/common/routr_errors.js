const Status = require('grpc').status
const { FonosError } = require('@fonos/errors')
module.exports = error => {
  if (!error.response) throw new FonosError(Status.UNKNOWN, error)
  const message = error.response.data.data
    ? error.response.data.data
    : error.response.data.message
  switch (error.response.status) {
    case 409:
      throw new FonosError(Status.FAILED_PRECONDITION, message)
    case 401:
      throw new FonosError(Status.UNAUTHENTICATED, message)
    case 422:
      throw new FonosError(Status.FAILED_PRECONDITION, message)
    case 404:
      throw new FonosError(Status.NOT_FOUND, message)
    case 400:
      throw new FonosError(Status.INVALID_ARGUMENT, message)
    default:
      throw new FonosError(Status.UNKNOWN)
  }
}
//# sourceMappingURL=routr_errors.js.map
