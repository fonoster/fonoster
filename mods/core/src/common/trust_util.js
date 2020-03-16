/**
 * @author Pedro Sanders
 * @since v1
 */
const grpc = require('grpc')
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const logger = require('./logger')

const CA_CRT = process.env.CERTS_PATH + '/ca.crt'
const SERVER_CRT = process.env.CERTS_PATH + '/server.crt'
const SERVER_KEY = process.env.CERTS_PATH + '/server.key'
const CLIENT_CRT = process.env.CERTS_PATH + '/client.crt'
const CLIENT_KEY = process.env.CERTS_PATH + '/client.key'

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

    let salt

    try {
        const pathToCerts = path.join(process.env.CERTS_PATH, 'jwt.salt')
        // TODO: Move elsewhere to avoid reading this file everytime
        salt = process.env.JWT_SALT || fs.readFileSync(pathToCerts).toString().trim()
    } catch(e) {
        logger.log('error', `Unable to find JWT_SALT environment variable or the certificates`)
        throw new Error('Unable to find JWT_SALT environment variable or the certificates')
    }

    if (call.metadata._internal_repr.access_key_id === null ||
        call.metadata._internal_repr.access_key_secret === null) {
            console.log('pinga001')
        throw new Error('Unauthorized')
        return
    }

    const accessKeyId = call.metadata._internal_repr.access_key_id.toString()
    const accessKeySecret = call.metadata._internal_repr.access_key_secret.toString()

    if (typeof accessKeySecret !== 'undefined') {
        try {
            const decoded = jwt.verify(accessKeySecret, salt)
            if(!decoded || accessKeyId !== decoded.sub) {
                console.log('pinga')
                throw new Error('Unauthorized')
            }
        } catch(e) {
            throw e
        }
    } else {
        console.log('pinga002')
        throw new Error('Unauthorized')
    }
}
