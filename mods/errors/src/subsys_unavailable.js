const YAPSError = require('./error')
const grpc = require('grpc')

class YAPSSubsysUnavailable extends YAPSError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YAPSSubsysUnavailable)
    }

    this.code = grpc.status.INTERNAL
  }
}

module.exports = YAPSSubsysUnavailable
