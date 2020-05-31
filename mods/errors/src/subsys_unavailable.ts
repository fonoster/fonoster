import FonosError from './error'
import grpc from 'grpc'

class FonosSubsysUnavailable extends FonosError {
  constructor (...params: any) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FonosSubsysUnavailable)
    }

    this.code = grpc.status.INTERNAL
  }
}

export default FonosSubsysUnavailable
