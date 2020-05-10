var Status = require('grpc').status
var YAPSError = require('./yaps_errors').YAPSError
module.exports = function (error) {
  if (!error.response) throw new YAPSError(Status.UNKNOWN, error)
  var message = error.response.data.data
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
//# sourceMappingURL=routr_errors.js.map
