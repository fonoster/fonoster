const FonosError = require('./error')
const grpc = require('grpc')

class FonosAuthError extends FonosError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosAuthError)
    }

    this.code = grpc.status.UNAUTHENTICATED
  }
}

module.exports = FonosAuthError
