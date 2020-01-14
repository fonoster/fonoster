/**
 * @author Pedro Sanders
 * @since v1
 * 
 * Used to simulate an Asterisk Channel
 */
const CHANNEL_STATUS_AVAILABLE = 0 // Channel is down and available
const CHANNEL_STATUS_UP = 6        // Line is up

class ChannelMock {

    constructor(callerId, extension) {
        this.status = CHANNEL_STATUS_AVAILABLE
        this.resetDataPointer()
        this.request = {}
        this.request.callerId = callerId? callerId : '1234'
        this.request.extension = extension? extension : '4321'
    }

    answer() {
        this.status = CHANNEL_STATUS_UP 
        return 0 // success
    }

    hangup() {
        this.status = CHANNEL_STATUS_AVAILABLE 
        return 1 // success
    }

    setAutoHangup(timeout) {
        throw 'not yet implemented'
    }

    getData(file, timeout, maxDigits) {
        const d = this.data[this.dataPointer]
        this.dataPointer = this.dataPointer + 1
        return d
    }

    streamFile(file, escapeDigits) {
        const d = this.data[this.dataPointer]
        this.dataPointer = this.dataPointer + 1
        return {code: 200, attributes: {result: d}}
    }

    setData(data) {
        this.data = data
    }

    resetDataPointer() {
        this.dataPointer = 0
    }

    recordFile(file, format, finishOnKey,
        maxDuration, offset, beep) {
        return {
            code: 200, 
            attributes: {
                result: {
                    file, format, finishOnKey, maxDuration, offset, beep
                }
            }
        }
    }
} 

module.exports = ChannelMock
module.exports.CHANNEL_STATUS_AVAILABLE = CHANNEL_STATUS_AVAILABLE
module.exports.CHANNEL_STATUS_UP = CHANNEL_STATUS_UP