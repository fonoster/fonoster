import FonosError from './error'
import grpc from 'grpc'

class FonosFailedPrecondition extends FonosError {
  constructor (...params: any) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosFailedPrecondition)
    }

    this.code = grpc.status.FAILED_PRECONDITION
  }
}

export default FonosFailedPrecondition
