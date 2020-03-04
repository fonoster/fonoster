/**
 * @author Pedro Sanders
 * @since v1
 */
const Storage = require('./core/storage')
const initStorageBucket = require('./utils/fsutils')

class App {

    initializeApp(config) {
        console.log('Initializing app')
        const storageBucket = config.storageBucket
            || process.env.FS_DEFAULT_STORAGE_BUCKET
        initStorageBucket(storageBucket)
        this.storage_ = new Storage(storageBucket)
        // Not yet implemented
        this.logging_ = console
    }

    storage() {
        return this.storage_
    }

    logging() {
        return this.logging_
    }
}

module.exports = new App()
