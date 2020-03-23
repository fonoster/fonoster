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
})
