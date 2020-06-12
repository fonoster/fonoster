import { UNKNOWN } from './codes'

class FonosError extends Error {
  code: any
  constructor (message: string, code = UNKNOWN) {
    super(message)
    this.name = this.constructor.name
    this.code = code

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export default FonosError
