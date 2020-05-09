const YAPSError = require('./error')
const grpc = require('grpc')

class YAPSInvalidArgument extends YAPSError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YAPSInvalidArgument)
    }

    this.code = grpc.status.INVALID_ARGUMENT
  }
}

module.exports = YAPSInvalidArgument
