import grpc from 'grpc'

class FonosError extends Error {
  code: any

  constructor (code = grpc.status.UNKNOWN, ...params: any) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosError)
    }

    this.code = code
  }
}

export default FonosError
