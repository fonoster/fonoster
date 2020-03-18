/**
 * @author Pedro Sanders
 * @since v1
 */
const NumbersPB = require('./protos/numbers_pb')
const {
    auth
} = require('../common/trust_util')
const redis = require('./redis')

const createNumber = async(call, callback) => {
    try {
        auth(call)
    } catch(e) {
       callback(new Error('UNAUTHENTICATED'), null)
       return
    }

    // TODO: Need to validate this numbers

    const number = call.request.getNumber()
    number.setCreateTime(new Date())
    number.setUpdateTime(new Date())

    await redis.call('sadd', 'numbers', number.getE164Number())
    await redis.call('set', number.getE164Number(), `${JSON.stringify(number)}`) // This feels very hacky
    await redis.call('set', `extlink:${number.getE164Number()}`, number.getIngressApp())

    callback(null, number)
}

module.exports.createNumber = createNumber
