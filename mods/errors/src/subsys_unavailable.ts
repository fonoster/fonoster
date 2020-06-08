import FonosError from './error'
import grpc from 'grpc'

class FonosSubsysUnavailable extends FonosError {
  constructor (message?: string) {
    super(message, grpc.status.INTERNAL)
  }
}

export default FonosSubsysUnavailable
