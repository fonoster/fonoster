const Domains = require('../src/domains')
const assert = require('assert')
const path = require('path')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('Domains Service', () => {
  let domains

  before(() => {
    domains = new Domains({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
  })

  it.only('Create domains perfect case...', done => {
    const domain = {
      name: 'Local Domain',
      domainUri: 'test.local'
    }

    domains
      .createDomain(domain)
      .then(r => done())
      .catch(err => done(err))
  })
})
