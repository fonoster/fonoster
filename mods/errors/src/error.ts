import { UNKNOWN } from './codes'

export default class extends Error {
  code: any
  constructor (message: string, code = UNKNOWN) {
    super(message)
    this.name = 'FonosError'
    this.code = code

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
