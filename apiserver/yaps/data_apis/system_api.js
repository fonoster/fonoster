/**
 * @author Pedro Sanders
 * @since v1
 */
const redis = require('redis')
const util = require('util')
const Sync = require('syncho')

class SystemAPI {

    getRedisConn() {
        const redisConn = redis.createClient({host: '192.168.99.100'})
        redisConn.on("error", e => console.error(e))
        redisConn.on("end", () => console.log('redis connection closed'))
        return redisConn
    }

    getTTSSpeachURI(filename) {
        const self = {}
        Sync(() => {
            const client = this.getRedisConn()
            const uri = this.hget('tts', filename).async()
            self.uri = uri
            console.log(uri)
        })
        return self.uri
    }
}

module.exports = SystemAPI