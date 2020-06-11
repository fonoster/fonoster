import Verb from './verb'

class Gather extends Verb {
  constructor (channel: any) {
    super(channel)
  }

  run (initDigits: string, options?: any) {
    // A timeout of 0 means no timeout
    // Less than one second will have no effect
    let timeout = 4 * 1000
    let finishOnKey = '#'
    let maxDigits = 0
    let digits = ''
    let c

    if (initDigits) digits = initDigits

    // Perform validations
    if (options) {
      if (options.finishOnKey && options.finishOnKey.length !== 1)
        throw new Error(
          'finishOnKey must a single char. Default value is #. Acceptable values are digits from 0-9,#,*'
        )
      // Less than one second will have no effect on the timeout
      if (options.timeout && (isNaN(options.timeout) || options.timeout < 0))
        throw new Error(
          `${options.timeout} is not an acceptable timeout value. For no timeout use zero. Timeout must be equal or greater than zero`
        )
      if (
        options.maxDigits &&
        (options.maxDigits <= 0 || isNaN(options.maxDigits))
      )
        throw new Error(
          `${options.maxDigits} is not an acceptable maxDigits value. The maxDigits value must be greater than zero. Omit value for no limit on the number of digits`
        )
      if (!options.maxDigits && !options.timeout) {
        throw new Error('you must provide either maxDigits or timeout')
      }

      // Overwrites timeout
      if (options.timeout) {
        if (options.timeout === 0) timeout = 0
        // Anywhere on from 0.1 to 0.9 the timeout should be near to zero(1 milly is close enough)
        if (options.timeout > 0 && options.timeout <= 1) timeout = 1
        // Rest on second to compensate the silence = 1 in getData
        if (options.timeout > 1) timeout = (options.timeout - 1) * 1000
      }
      if (options.finishOnKey) finishOnKey = options.finishOnKey
      if (options.maxDigits) maxDigits = options.maxDigits
    }

    for (;;) {
      if (
        c === finishOnKey ||
        digits.length >= maxDigits ||
        (c === null && timeout > 0)
      ) {
        return digits
      }

      c = this.channel.getData('silence/1', timeout, 1)

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
