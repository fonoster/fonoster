import FonosError from './error'
import { UNAUTHENTICATED } from './codes'

class FonosAuthError extends FonosError {
  constructor (message?: string) {
    super(message, UNAUTHENTICATED)
  }
}

export default FonosAuthError
