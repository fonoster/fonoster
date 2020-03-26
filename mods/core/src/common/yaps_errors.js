const grpc = require('grpc')

class YAPSError extends Error {
  constructor (code = grpc.status.UNKNOWN, ...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YAPSError)
    }

    this.code = code
  }
}

class YAPSAuthError extends YAPSError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YAPSAuthError)
    }

    this.code = grpc.status.UNAUTHENTICATED
  }
}

class YAPSInvalidArgument extends YAPSError {
  constructor (...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YAPSInvalidArgument)
    }

    this.code = grpc.status.INVALID_ARGUMENT
  }
}

module.exports.YAPSError = YAPSError
module.exports.YAPSAuthError = YAPSAuthError
module.exports.YAPSInvalidArgument = YAPSInvalidArgument
