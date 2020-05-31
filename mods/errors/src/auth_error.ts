import FonosError from './error'
import grpc from 'grpc'

class FonosAuthError extends FonosError {
  constructor (...params: any) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosAuthError)
    }

    this.code = grpc.status.UNAUTHENTICATED
  }
}

export default FonosAuthError
