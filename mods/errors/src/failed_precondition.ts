import FonosError from './error'
import { FAILED_PRECONDITION } from './codes'

class FonosFailedPrecondition extends FonosError {
  constructor (message?: string) {
    super(message, FAILED_PRECONDITION)
  }
}

export default FonosFailedPrecondition
