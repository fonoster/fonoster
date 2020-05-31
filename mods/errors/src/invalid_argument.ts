import FonosError from './error'
import grpc from 'grpc'

class FonosInvalidArgument extends FonosError {
  constructor (...params: any) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosInvalidArgument)
    }

    this.code = grpc.status.INVALID_ARGUMENT
  }
}

export default FonosInvalidArgument
