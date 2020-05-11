const grpc = require('grpc')

class FonosError extends Error {
  constructor (code = grpc.status.UNKNOWN, ...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosError)
    }

    this.code = code
  }
}

module.exports = FonosError
