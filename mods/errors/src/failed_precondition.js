const YAPSError = require('./error')
const grpc = require('grpc')

class YAPSFailedPrecondition extends YAPSError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YAPSFailedPrecondition)
    }

    this.code = grpc.status.FAILED_PRECONDITION
  }
}

module.exports = YAPSFailedPrecondition
