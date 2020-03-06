const yaps = require('@yaps/core/app')

const prodConfig = {
    projectId: "tts-storage",
    apiKey: "AIzaSyAshRmJgF-p3IesZfmeLzhB-n705ePUAFA",
    storageBucket: "default"
}

const devConfig = {
    projectId: "tts-storage",
    apiKey: "AIzaSyAshRmJgF-p3IesZfmeLzhB-n705ePUAFA",
    storageBucket: "default-test"
}

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig

yaps.initializeApp(config)
module.exports.storage = yaps.storage()
