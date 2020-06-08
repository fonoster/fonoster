import FonosError from './error'
import grpc from 'grpc'

class FonosAuthError extends FonosError {
  constructor (message?: string) {
    super(message, grpc.status.UNAUTHENTICATED)
  }
}

export default FonosAuthError
