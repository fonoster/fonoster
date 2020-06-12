import FonosError from './error'
import { INVALID_ARGUMENT } from './codes'

class FonosInvalidArgument extends FonosError {
  constructor (message?: string) {
    super(message, INVALID_ARGUMENT)
  }
}

export default FonosInvalidArgument
