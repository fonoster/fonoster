/**
 * @author Pedro Sanders
 * @since v1
 */
const objectid = require('objectid')

class YapsWrapperChannel {

    constructor(channel, conf) {
        this.channel = channel
        this.config(conf)
        this.eventsAPI = conf.eventsAPI
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
            vars: new Map(),
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

    config(conf) {
        this.conf = conf
    }

    answer() {
        return this.channel.answer()
        //if (result.code !== 200) throw result.rawReply
        //return 0
    }
    
    hangup() {
        return this.channel.hangup()
        //if (result.code !== 200) throw result.rawReply
        //return 1
    }

    setAutoHangup(timeout) {
        throw 'not yet implemented'
        if (timeout && isNaN(timeout)) throw 'timeout is not a number'        
        return this.channel.setAutoHangup(timeout)
    }   

    /**
     *
     * Param file - Is a file that has been previously uploaded or is available by default.
     * Param options - Optional parameters to alter the command's normal behavior.
     * 
     * Example options {
     *     finishOnKey: #,     // Default
     * }
     * 
     * Returns - Sent DTMF or undefined if no key was pressed before audio ends
     */
    play(file, options)  {
        if (!file) throw 'you must indicate a file.'
        let finishOnKey = '#'

        if (options) {
            if (options.finishOnKey && (options.finishOnKey.length !== 1 
                || ('1234567890#*').indexOf(options.finishOnKey) < 0 )) 
                throw 'finishOnKey must a single char. Default value is #. Acceptable values are digits from 0-9,#,*'
            
            if (options.finishOnKey) finishOnKey = options.finishOnKey
        }
            
        const result = this.channel.streamFile(file, finishOnKey)

        if (result.code === 200) return result.attributes.result

        throw result.rawReply
    }   
 
    /**
     * Param text - Will be convert into a file and put in a cache for future use.
     * This method behavior is similar than play.
     * Example options {
     *     finishOnKey: #,     // Default
     * }
     * 
     * Returns - Sent DTMF or undefined if no key was pressed before audio ends
     */
    say(text, options) {
        if (!text) throw 'You must provide a text.'
        // This returns the route to the generated audio
        if (!this.conf.tts) {
            throw 'not tts engine found'
        }
        const filename = this.conf.tts.generate(text)
        return this.play(filename, options)
    }

    /**
     * Param time - Time to wait in seconds. Defaults to 1s.
     */
    wait(time) {
        let t = 1
    
        if (time && time <= 0) throw 'time must an number equal or greater than zero.'
        if (time) t = time
    
        while(t > 0) {
            this.play('silence/1')
            t--
        }
    }

    /**
     * The Gather verb is used in combination with Play, Say, Wait. The are pipeline together
     * to create this powerful verb.
     *
     * Example options {
     *     timeout: 4,         // Time in between key pressed. Defaults to 4 seconds.
     *                          // A time of zero will wait for ever for the finishOnKey.
     *     finishOnKey: #,     // Default
     *     maxDigits: 4        // Wait for the user to press digit.
     * }
     *
     * Note: Either maxDigits or timeout must be greater than zero.
     * 
     * Returns - Sent digits or undefined if no key was pressed before timeout
     */
    gather(initDigits, options) {
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
                throw 'finishOnKey must a single char. Default value is #. Acceptable values are digits from 0-9,#,*'
            // Less than one second will have no effect on the timeout
            if (options.timeout && (isNaN(options.timeout) || options.timeout < 0))
                throw `${options.timeout} is not an acceptable timeout value. For no timeout use zero. Timeout must be equal or greater than zero`
            if (options.maxDigits && (options.maxDigits <= 0 || isNaN(options.maxDigits)))
                throw `${options.maxDigits} is not an acceptable maxDigits value. The maxDigits value must be greater than zero. Omit value for no limit on the number of digits`
            if (!options.maxDigits && !options.timeout) {
                throw `you must provide either maxDigits or timeout`
            }

            // Overwrites timeout
            if (options.timeout) {
                if(options.timeout === 0 ) timeout = 0
                // Anywhere on from 0.1 to 0.9 the timeout should be near to zero(1 milly is close enough)
                if(options.timeout > 0 && options.timeout <= 1) timeout = 1
                // Rest on second to compensate the silence = 1 in getData
                if(options.timeout > 1) timeout = (options.timeout - 1) * 1000
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
            if (c === finishOnKey
                || digits.length >= maxDigits
                || (c === null && timeout > 0)) {
                return digits
            }

            c = this.channel.getData('silence/1', timeout, 1)

            if (c && (finishOnKey).indexOf(c) === -1) {
                digits = digits.concat(c)
                continue
            }
            break
        }

        return digits
    }

    /**
     * Record creates a file with the sound send by receiving device
     * Example options {
     *     timeout: 4,         // Default
     *     finishOnKey: #,     // Characters used to finish the recording
     *     beep: true,
     *     offset: 0,
     *     maxDuration: 3600   // Maximum duration in seconds
     * }
     *
     * Returns - Metadata with information about the recordings
     * 
     * TODO: Add constrains for the file's format
     */
    record(options) {
        const result = {}
        const format = 'wav'
        let offset = 0
        let beep = true
        let maxDuration = 3600 * 1000
        let finishOnKey = '1234567890#*'

        if (options) {
            if (options.maxDuration && options.maxDuration < 1) throw `${options.maxDuration} is not an acceptable maxDuration value. Must be a number greater than 1. Default is 3600 (1 hour)`
            if (options.beep && typeof(options.beep) !== 'boolean') throw `${options.beep} is not an acceptable value. Must be a true or false`

            // Overwrite values
            if (options.maxDuration) maxDuration = options.maxDuration * 1000
            if (options.beep) beep = options.beep
            if (options.finishOnKey) finishOnKey = options.finishOnKey
        }

        const filename = objectid()
        const file = `${process.MS_RECORDINGS_TEMP_FOLDER}/${filename}`

        console.log(`file ${file}`)

        const res = this.channel.recordFile(file, format, finishOnKey,
            maxDuration, offset, beep)

        if (res.code !== 200) throw res.rawReply

        result.keyPressed = res.attributes.result
        result.recordingUri = `${process.RECORDINGS_BASE_URI}/${filename}.${format}`
        result.filename = filename
        result.format = format
        result.callRef = this.callDetailRecord.ref

        this.eventsAPI.recordingCompleted(result)

        return result
    }

    stash(key, value) {
        this.callDetailRecord.vars.set(key, value)
    }

    getCallDetailRecord() {
        return this.callDetailRecord
    }
}  

module.exports = YapsWrapperChannel 