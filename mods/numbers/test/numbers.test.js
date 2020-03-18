/**
 * @author Pedro Sanders
 * @since v1
 */
const Numbers = require('../src/numbers')
const assert = require('assert')

if(process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV ) {
    require('dotenv').config({ path: __dirname + '/../../.env' })
}

describe('Numbers Service', () => {
    let numbers

    before(() => {
        numbers = new Numbers({
            endpoint: `${process.env.APISERVER_ENDPOINT}`
        })
    })

    it.only('Create number', done => {
        numbers.createNumber({
            e164Number: '+17853178070',
            ingressApp: 'hello-monkeys'
        })
        .then(number => {
            assert.ok(number.getE164Number() === '+17853178070')
            done()
        }).catch(e => done(e))
    })

})
