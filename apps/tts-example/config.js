const YAPS = require('@yaps/sdk')

const config = {
    apptId: "tts-storage",
    apiKey: "AIzaSyAshRmJgF-p3IesZfmeLzhB-n705ePUAFA",
    bucket: "default-test"
}

YAPS.initializeApp(config)

module.exports.storage = new YAPS.Storage()
