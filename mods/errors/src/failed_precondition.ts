import FonosError from './error'
import grpc from 'grpc'

class FonosFailedPrecondition extends FonosError {
  constructor (message?: string) {
    super(message, grpc.status.FAILED_PRECONDITION)
  }
}

export default FonosFailedPrecondition
