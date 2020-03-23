const Domains = require('../src/domains')
const assert = require('assert')

if (process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV) {
  require('dotenv').config({ path: __dirname + '/../../.env' })
}

describe('Domains Service', () => {
  let domains

  before(() => {
    domains = new Domains({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
  })
})
