const Status = require('grpc').status
const { YAPSError } = require('@yaps/errors')

module.exports = (error: any) => {
  if (!error.response) throw new YAPSError(Status.UNKNOWN, error)

  const message = error.response.data.data
    ? error.response.data.data
    : error.response.data.message

  switch (error.response.status) {
    case 409:
      throw new YAPSError(Status.FAILED_PRECONDITION, message)
    case 401:
      throw new YAPSError(Status.UNAUTHENTICATED, message)
    case 422:
      throw new YAPSError(Status.FAILED_PRECONDITION, message)
    case 404:
      throw new YAPSError(Status.NOT_FOUND, message)
    case 400:
      throw new YAPSError(Status.INVALID_ARGUMENT, message)
    default:
      throw new YAPSError(Status.UNKNOWN)
  }
}
