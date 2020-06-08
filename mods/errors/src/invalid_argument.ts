import FonosError from './error'
import grpc from 'grpc'

class FonosInvalidArgument extends FonosError {
  constructor (message?: string) {
    super(message, grpc.status.INVALID_ARGUMENT)
  }
}

export default FonosInvalidArgument
