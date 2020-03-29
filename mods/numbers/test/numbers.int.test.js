const Numbers = require('../src/numbers')
const assert = require('assert')
const path = require('path')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('Numbers Service', () => {
  let numbers
  let numberRef

  before(() => {
    numbers = new Numbers({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
  })

  it.skip('Create number missing provider reference', done => {
    numbers
      .createNumber({
        e164Number: '0000000000',
        ingressApp: 'hello-monkeys'
      })
      .then(r => done('not good'))
      .catch(err => {
        assert.ok(err.message.includes('FAILED_PRECONDITION'))
        done()
      })
  })

  it.skip('Create number missing provider reference', done => {
    numbers
      .createNumber({
        providerRef: 'bad_reference',
        e164Number: '0000000000',
        ingressApp: 'hello-monkeys'
      })
      .then(r => done('not good'))
      .catch(err => {
        assert.ok(err.message.includes('FAILED_PRECONDITION'))
        done()
      })
  })

  it.skip('Create number', done => {
    numbers
      .createNumber({
        providerRef: '5e7fc0caa0484e0d669cb783',
        e164Number: '0000000000',
        ingressApp: 'hello-monkeys'
      })
      .then(number => {
        numberRef = number.getRef()
        assert.ok(number.getE164Number() === '0000000000')
        done()
      })
      .catch(e => {
        done(e)
      })
  })

  it.skip('Get ingress app', done => {
    numbers
      .getIngressApp({ e164Number: '0000000000' })
      .then(app => {
        assert.ok(app.getName() === 'hello-monkeys')
        done()
      })
      .catch(e => done(e))
  })

  it.skip('Number already exist', done => {
    numbers
      .createNumber({
        providerRef: '5e7f86e3a0484e0615c36f09',
        e164Number: '+17853178070',
        ingressApp: 'hello-monkeys'
      })
      .then(r => done('not good'))
      .catch(err => {
        assert.ok(err.message.includes('FAILED_PRECONDITION'))
        done()
      })
  })

  it.skip('List numbers', done => {
    numbers
      .listNumbers({ pageSize: 10, pageToken: '0', view: 0 })
      .then(result => {
        assert.ok(result.getNumbersList().length > 0)
        done()
      })
      .catch(err => done(err))
  })

  it.skip('Get number by reference', done => {
    numbers
      .getNumber(numberRef)
      .then(number => {
        assert.ok(number.getRef() === numberRef)
        done()
      })
      .catch(err => done(err))
  })

  it.skip('Update number perfect case...', done => {
    const number = {
      ref: numberRef,
      aorLink: 'sip:1001@sip.local'
    }

    numbers
      .updateNumber(number)
      .then(numberFromDB => {
        assert.ok(number.ref === numberFromDB.getRef())
        done()
      })
      .catch(err => done(err))
  })

  it.skip('Delete number', done => {
    numbers
      .deleteNumber(numberRef)
      .then(() => done())
      .catch(err => done(err))
  })

  it.skip('Number reference does not exist', done => {
    numbers
      .deleteNumber('1234')
      .then(() => done('not good'))
      .catch(err => {
        assert.ok(err.message.includes('NOT_FOUND'))
        done()
      })
  })
})
