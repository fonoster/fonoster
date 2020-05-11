const FonosError = require('./error')
const grpc = require('grpc')

class FonosInvalidArgument extends FonosError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosInvalidArgument)
    }

    this.code = grpc.status.INVALID_ARGUMENT
  }
}

module.exports = FonosInvalidArgument
