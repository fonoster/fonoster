import Verb from './verb'
import assert from 'assert'

interface GatherOptions {
  timeout: number
  finishOnKey: string
  maxDigits: number
  digits: string
}

const validateSingleChar = (name: string, value: string) => {
  if (value && value.length > 1)
    throw `${name} must a single char. Default value is #. Acceptable values are digits from 0-9,#,*`
}

const validateTimeout = (timeout: number) => {
  if (timeout && (isNaN(timeout) || timeout < 0))
    throw `${timeout} is not an acceptable timeout value. For no timeout use zero. Timeout must be equal or greater than zero`
}

const validateMaxDigits = (maxDigits: number) => {
  if ((maxDigits && isNaN(maxDigits)) || maxDigits <= 0)
    throw `${maxDigits} is not an acceptable maxDigits value. The maxDigits value must be greater than zero. Omit value for no limit on the number of digits`
}

const validateHasMaxDigitsOrTimeout = (options: GatherOptions) => {
  if (!options.maxDigits && !options.timeout)
    throw `you must provide either maxDigits or timeout`
}

const foundFinishKey = (c: string, finishOnKey: string) => c === finishOnKey
const reachedMaxDigits = (digits: string, maxDigits: number) =>
  digits.length >= maxDigits
const reachedTimeout = (c: string, timeout: number) => c === null && timeout > 0

class Gather extends Verb {
  constructor (channel: any) {
    super(channel)
  }

  validate (options: any) {
    validateSingleChar('finishOnKey', options.finishOnKey)
    validateTimeout(options.timeout)
    validateMaxDigits(options.maxDigits)
    validateHasMaxDigitsOrTimeout(options)
  }

  run (initDigits?: string, options?: GatherOptions): string {
    let { maxDigits, timeout = 4000, finishOnKey = '#', digits = '' } = options

    this.validate(options)

    if (initDigits) digits = initDigits

    while (true) {
      const c = this.channel.getData('silence/1', timeout, 1)

      if (
        foundFinishKey(c, finishOnKey) ||
        reachedMaxDigits(digits, maxDigits) ||
        reachedTimeout(c, timeout)
      )
        return digits

      if (c && finishOnKey.indexOf(c) === -1) {
        digits = digits.concat(c)
        continue
      }
      break
    }

    return digits
  }
}

export default Gather
