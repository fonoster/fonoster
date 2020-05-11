const FonosError = require('./error')
const grpc = require('grpc')

class FonosFailedPrecondition extends FonosError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosFailedPrecondition)
    }

    this.code = grpc.status.FAILED_PRECONDITION
  }
}

module.exports = FonosFailedPrecondition
