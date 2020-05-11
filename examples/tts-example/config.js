const Fonos = require('@fonos/sdk')

const config = {
    apptId: "tts-storage",
    apiKey: "AIzaSyAshRmJgF-p3IesZfmeLzhB-n705ePUAFA",
    bucket: "default-test"
}

Fonos.initializeApp(config)

module.exports.storage = new Fonos.Storage()
