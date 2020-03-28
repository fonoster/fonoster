const Status = require('grpc').status
const { YAPSError } = require('./yaps_errors')

module.exports = error => {
  if (!error.response) throw new YAPSError(Status.UNKNOWN, error)

  const message = error.response.data.message

  switch (error.response.status) {
    case 409:
      throw new YAPSError(Status.FAILED_PRECONDITION, message)
    case 401:
      throw new YAPSError(Status.UNAUTHENTICATED, message)
    case 422:
      throw new YAPSError(Status.FAILED_PRECONDITION, message)
    case 404:
      throw new YAPSError(Status.NOT_FOUND, message)
    default:
      throw new YAPSError(Status.UNKNOWN)
  }
}
