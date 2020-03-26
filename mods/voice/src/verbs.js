const path = require('path')
const objectid = require('objectid')
const { logger } = require('@yaps/core')
const { computeFilename, transcodeSync } = require('@yaps/tts').utils

/**
 * @classdescNode JS Implementation of the Verbs API.
 */
class Verbs {
  /**
   * Constructs a new Verbs object.
   */
  constructor (channel, config) {
    this.channel = channel
    this._config = config
    this.callDetailRecord = {
      ref: objectid(),
      date: new Date(),
      from: channel.request.callerid,
      to: channel.request.extension,
      created: new Date(),
      modified: new Date(),
      start: new Date(),
      end: new Date(),
      duration: 0,
      vars: new Map()
      // TODO
      //answerBy
      //userRef,
      //appRef,
      //direction,
      //status,
      //cost,
      //billable
    }
  }

  /**
   * Configure the Verbs object.
   *
   * @param {Object} config
   * @param {string} config.bucket - Change default bucket
   * @param {string} config.storage - A replacement for the storage. Use this
   * Only to overwrite the parameters set in your `yaps.json.`
   * @param {string} config.tts - A replacement for the default TTS engine
   */
  config (config) {
    this._config = config
  }

  /**
   * Answer a call if not already answered.
   */
  answer () {
    return this.channel.answer()
    //if (result.code !== 200) throw new Error(result.rawReply)
    //return 0
  }

  /**
   * Terminates a call if not already terminated.
   */
  hangup () {
    return this.channel.hangup()
    //if (result.code !== 200) throw new Error(result.rawReply)
    //return 1
  }

  /**
   * Terminates at `timeout`
   */
  setAutoHangup (timeout) {
    new Error('not yet implemented')
    if (timeout && isNaN(timeout)) throw new Error('timeout is not a number')
    return this.channel.setAutoHangup(timeout)
  }

  /**
   * Plays an audio in the calls channel.
   *
   * @param {string} file - Is a file that has been previously uploaded or is
   * available by default in the applications bucket.
   * @param {Object} options - Optional parameters to alter the command's normal
   * behavior
   * @param {string} options.finishOnKey - Key to terminate the playing
   * @returns {string} Pressed key or undefined if no key was pressed before
   * timeout
   * @example
   *
   * const options {
   *   finishOnKey: '#'',
   * }
   *
   * const result = chan.play('tts-monkeys', options)
   */
  play (file, options) {
    logger.log(
      'debug',
      `@yaps/voice.YapsWrapperChannel.play [file: ${file}, options: ${JSON.stringify(
        options
      )}]`
    )
    if (!file) throw new Error('you must indicate a file.')
    let finishOnKey = '#'

    if (options) {
      if (
        options.finishOnKey &&
        (options.finishOnKey.length !== 1 ||
          '1234567890#*'.indexOf(options.finishOnKey) < 0)
      )
        throw new Error(
          'finishOnKey must a single char. Default value is #. Acceptable values are digits from 0-9,#,*'
        )

      if (options.finishOnKey) finishOnKey = options.finishOnKey
    }

    const result = this.channel.streamFile(file, finishOnKey)

    logger.log(
      'debug',
      `@yaps/voice.YapsWrapperChannel.play [result: ${JSON.stringify(result)}]`
    )

    if (result.code === 200) return result.attributes.result

    throw new Error(result.rawReply)
  }

  /**
   * Sythentizes a text and streams the resulting audio.
   *
   * @param {string} text - Will be convert into a file and put in a cache for
   * future use.
   * @param {Object} options - Optional parameters to alter the command's normal behavior.
   * @param {string} options.finishOnKey - Key to terminate the playing
   * @returns {string} Pressed key or undefined if no key was pressed before
   * timeout
   * @example
   *
   * const options {
   *   finishOnKey: '#'',
   * }
   *
   * const result = chan.say('hello, this is an audio sample', options)
   */
  say (text, options) {
    logger.log(
      'verbose',
      `@yaps/voice.YapsWrapperChannel.say [text: ${text}, options: ${JSON.stringify(
        options
      )}]`
    )
    if (!text) throw new Error('You must provide a text.')
    if (!this._config.tts) throw new Error('Not tts engine found')
    if (!this._config.storage) throw new Error('Not storage object found')
    if (!this._config.bucket) throw new Error('Not bucket found')

    // The final format pushed to the bucket will always be .wav
    const metadata = { 'Content-Type': 'audio/x-wav' }
    const filename = 't_' + computeFilename(text, options)

    logger.log(
      'debug',
      `@yaps/voice.YapsWrapperChannel.say [filename: ${filename}]`
    )

    let url

    try {
      url = this._config.storage.getObjectURLSync({
        name: filename,
        bucket: this._config.bucket
      })
    } catch (e) {
      logger.log(
        'silly',
        `@yaps/vouice.YapsWrapperChannel.say [no url found for file ${filename}]`
      )
    }

    logger.log('debug', `@yaps/vouice.YapsWrapperChannel.say [url: ${url}]`)

    if (url === undefined) {
      const pathToFile = this._config.tts.synthesizeSync(text, options)
      const pathToTranscodedFile = path.join(path.dirname(pathToFile), filename)
      transcodeSync(pathToFile, pathToTranscodedFile)

      logger.log(
        'debug',
        `@yaps/vouice.YapsWrapperChannel.say[pathToTranscodedFile: ${pathToTranscodedFile}]`
      )

      this._config.storage.uploadObjectSync({
        filename: pathToTranscodedFile,
        bucket: this._config.bucket,
        metadata
      })

      url = this._config.storage.getObjectURLSync({
        name: filename,
        bucket: this._config.bucket
      })
    }

    return this.play(url, options)
  }

  /**
   * Plays a silence for `time` seconds.
   */
  wait (time) {
    let t = 1

    if (time && time <= 0)
      throw new Error('time must an number equal or greater than zero.')
    if (time) t = time

    while (t > 0) {
      this.play('silence/1')
      t--
    }
  }

  /**
   * The Gather verb is used in combination with Play, Say, Wait.
   *
   * @param {string} text - Will be convert into a file and put in a cache for
   * future use.
   * @param {Object} options - Optional parameters to alter the command's normal
   * behavior.
   * @param {string} options.timeout - Time to finish if no key is pressed
   * @param {string} options.finishOnKey - Key to terminate the playing
   * @param {string} options.maxDigits - Max number of digits accepted
   * @returns {string} Pressed digits or undefined if no keys were pressed before
   * timeout
   * @example
   *
   * const options {
   *   finishOnKey: '#'',
   *   maxDigits: 4
   * }
   *
   * const result = chan.gather(chan.say('this is an audio sample'), options)
   */
  gather (initDigits, options) {
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
          `${
            options.timeout
          } is not an acceptable timeout value. For no timeout use zero. Timeout must be equal or greater than zero`
        )
      if (
        options.maxDigits &&
        (options.maxDigits <= 0 || isNaN(options.maxDigits))
      )
        throw new Error(
          `${
            options.maxDigits
          } is not an acceptable maxDigits value. The maxDigits value must be greater than zero. Omit value for no limit on the number of digits`
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
      // Break it if
      // 1. User enters finishOnKey(ie.: #)
      // 2. The length of digits is equal or greater than maxDigits
      // 3. Character c is null given that timeout !== 0
      // Note: Timeout !== 0 means no timeout.
      // Char 'c' will be null if timeout event is fired
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

  /**
   * Record creates a file with the sound send by receiving device
   *
   * @param {string} text - Will be convert into a file and put in a cache for
   * future use.
   * @param {Object} options - Optional parameters to alter the command's normal
   * behavior.
   * @param {string} options.timeout - Time to finish if no key is pressed
   * @param {string} options.finishOnKey - Key to terminate the playing
   * @param {string} options.beep - Wether to beep or not before beginig the
   * recordings. Defaults to 'false'
   * @param {string} options.offset - Causes the recording to first seek to the
   * specified offset before recording begins
   * @param {string} options.maxDuration - Maximum duration of the recording.
   * Defaults to `1 hour.`
   * @returns {string} Metadata with information about the recordings
   * @todo Add constrains for the file's format
   * @example
   *
   * const options = {
   *     timeout: 4,         // Default
   *     finishOnKey: #,     // Characters used to finish the recording
   *     beep: true,
   *     offset: 0,
   *     maxDuration: 3600   // Maximum duration in seconds
   * }
   *
   * const result = chan.record(options)
   */
  record (options) {
    const result = {}
    const format = 'wav'
    let offset = 0
    let beep = true
    let maxDuration = 3600 * 1000
    let finishOnKey = '1234567890#*'

    if (options) {
      if (options.maxDuration && options.maxDuration < 1)
        throw new Error(
          `${
            options.maxDuration
          } is not an acceptable maxDuration value. Must be a number greater than 1. Default is 3600 (1 hour)`
        )
      if (options.beep && typeof options.beep !== 'boolean')
        throw new Error(
          `${options.beep} is not an acceptable value. Must be a true or false`
        )

      // Overwrite values
      if (options.maxDuration) maxDuration = options.maxDuration * 1000
      if (options.beep) beep = options.beep
      if (options.finishOnKey) finishOnKey = options.finishOnKey
    }

    const filename = objectid()
    const file = `${process.MS_RECORDINGS_TEMP_FOLDER}/${filename}`
    const res = this.channel.recordFile(
      file,
      format,
      finishOnKey,
      maxDuration,
      offset,
      beep
    )

    if (res.code !== 200) throw new Error(res.rawReply)

    result.keyPressed = res.attributes.result
    result.recordingUri = `${process.RECORDINGS_BASE_URI}/${filename}.${format}`
    result.filename = filename
    result.format = format
    result.callRef = this.callDetailRecord.ref

    return result
  }

  /**
   * Saves a set of key,value in the Call Detail Record.
   *
   * @example
   *
   * chan.stash('choice', chan.say('enter your option'))
   */
  stash (key, value) {
    this.callDetailRecord.vars.set(key, value)
  }

  getCallDetailRecord () {
    return this.callDetailRecord
  }
}

module.exports = Verbs
