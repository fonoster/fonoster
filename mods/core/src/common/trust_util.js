const grpc = require('grpc')
const fs = require('fs')
const jwt = require('jsonwebtoken')

const CA_CRT = "/Users/pedrosanders/Projects/yaps/certs/ca.crt"
const SERVER_CRT = "/Users/pedrosanders/Projects/yaps/certs/server.crt"
const SERVER_KEY = "/Users/pedrosanders/Projects/yaps/certs/server.key"
const CLIENT_CRT = "/Users/pedrosanders/Projects/yaps/certs/client.crt"
const CLIENT_KEY = "/Users/pedrosanders/Projects/yaps/certs/client.key"

// TODO: Retrive path to certificates from env
module.exports.getServerCredentials = () => grpc.ServerCredentials.createSsl(
    fs.readFileSync(CA_CRT),
    [
      {
        cert_chain: fs.readFileSync(SERVER_CRT),
        private_key: fs.readFileSync(SERVER_KEY)
      }
    ],
    true
)

module.exports.getClientCredentials = () => grpc.credentials.createSsl(
    fs.readFileSync(CA_CRT),
    fs.readFileSync(CLIENT_KEY),
    fs.readFileSync(CLIENT_CRT)
)

module.exports.auth = function(call, callback) {
    let JWT_SALT

    try {
        // TODO: Move elsewhere to avoid reading this file everytime
        JWT_SALT = process.env.JWT_SALT || fs.readFileSync('~/jwt.salt').toString()
    } catch(e) {
        throw `Unable to find JWT_SALT environment variable or the ~/jwt.salt file`
    }

    // Server will crash if we call toString() on null (no auth header sent).
    if (call.metadata._internal_repr.access_key_id === null ||
        call.metadata._internal_repr.access_key_secret === null) {
        throw 'Unauthorized'
        //callback(new Error('Unauthorized'), null)
        return
    }

    const accessKeyId = call.metadata._internal_repr.access_key_id.toString()
    const accessKeySecret = call.metadata._internal_repr.access_key_secret.toString()

    if (typeof accessKeySecret !== 'undefined') {
        try {
            const decoded = jwt.verify(accessKeySecret, JWT_SALT)
            if(!decoded || accessKeyId !== decoded.sub) {
                throw 'Unauthorized'
            }
        } catch(e) {
            console.error(e)
            throw 'Unauthorized'
        }
    } else {
        throw 'Unauthorized'
    }
}
