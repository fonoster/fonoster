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

module.exports = YAPSError
