const FonosError = require('./error')
const grpc = require('grpc')

class FonosSubsysUnavailable extends FonosError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosSubsysUnavailable)
    }

    this.code = grpc.status.INTERNAL
  }
}

module.exports = FonosSubsysUnavailable
