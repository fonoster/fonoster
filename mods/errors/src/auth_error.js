const YAPSError = require('./error')
const grpc = require('grpc')

class YAPSAuthError extends YAPSError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YAPSAuthError)
    }

    this.code = grpc.status.UNAUTHENTICATED
  }
}

module.exports = YAPSAuthError
