const Routr = require('../src/common/routr_client')
const path = require('path')
const assert = require('assert')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('Routr Client Test', () => {
  let token
  let routr
  let domainRef
  let domainFromDB

  before(async () => {
    const baseUrl = `https://${process.env.SIPPROXY_HOST}:${
      process.env.SIPPROXY_API_PORT
    }/api/v1beta1`
    routr = new Routr(baseUrl)
    const response = await routr.getToken(
      process.env.SIPPROXY_API_USERNAME,
      process.env.SIPPROXY_API_SECRET
    )
    token = response.data.data
  })

  it.only('Create domain', done => {
    const domain = {
      apiVersion: 'v1beta1',
      kind: 'Domain',
      metadata: {
        name: 'Test Domain'
      },
      spec: {
        context: {
          domainUri: 'sip.local'
        }
      }
    }

    routr
      .withToken(token)
      .forResource('domains')
      .create(domain)
      .then(ref => {
        domainRef = ref
        done()
      })
      .catch(err => done(err))
  })

  it.only('Get domain', done => {
    routr
      .withToken(token)
      .forResource('domains')
      .get(domainRef)
      .then(domain => {
        domainFromDB = domain
        assert.ok(domain.metadata.name === 'Test Domain')
        done()
      })
      .catch(err => done(err))
  })

  it.only('List domains', done => {
    routr
      .withToken(token)
      .forResource('domains')
      .list()
      .then(domains => {
        assert.ok(domains.length > 0)
        done()
      })
      .catch(err => done(err))
  })

  it.only('Update domain', done => {
    domainFromDB.metadata.name = 'Test Domain Changed'
    routr
      .withToken(token)
      .forResource('domains')
      .update(domainFromDB)
      .then(ref => {
        done()
      })
      .catch(err => done(err))
  })

  it.only('Delete domains', done => {
    routr
      .withToken(token)
      .forResource('domains')
      .del(domainFromDB.metadata.ref)
      .then(() => {
        done()
      })
      .catch(err => done(err))
  })
})
