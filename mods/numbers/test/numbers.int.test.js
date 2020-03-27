const Numbers = require('../src/numbers')
const assert = require('assert')
const path = require('path')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('Numbers Service', () => {
  let numbers

  before(() => {
    numbers = new Numbers({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
  })

  // TODO: See if we can call this before get ingress app
  it('Create number', done => {
    numbers
      .createNumber({
        e164Number: '+17853178070',
        ingressApp: 'hello-monkeys'
      })
      .then(number => {
        assert.ok(number.getE164Number() === '+17853178070')
        done()
      })
      .catch(e => done(e))
  })

  // They need to be an existing app for this to work
  it.skip('Get ingress app', done => {
    numbers
      .getIngressApp({ e164Number: '+17853178070' })
      .then(app => {
        console.log('what the pinga:', app)
        assert.ok(app.getName() === 'hello-monkeys')
        done()
      })
      .catch(e => done(e))
  })
})
