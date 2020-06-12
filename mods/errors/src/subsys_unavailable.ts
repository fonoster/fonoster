import FonosError from './error'
import { INTERNAL } from './codes'

class FonosSubsysUnavailable extends FonosError {
  constructor (message?: string) {
    super(message, INTERNAL)
  }
}

export default FonosSubsysUnavailable
