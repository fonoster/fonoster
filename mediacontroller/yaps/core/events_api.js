/**
 * @author Pedro Sanders
 * @since v1
 */
class EventsAPI {

    recordingCompleted(recording) {
        console.log(`reconding info: ${JSON.stringify(recording)}`)
    }

    callCompleted(callDetailRecord) {
        console.log(`call detail record: ${JSON.stringify(callDetailRecord)}`)
    }
}  

module.exports = EventsAPI 