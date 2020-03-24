const routr = require('../src/server/routr')
const path = require('path')
const assert = require('assert')
const {
  ResourceBuilder,
  Kind,
  Privacy
} = require('../src/common/resource_builder')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('Routr Client Test', () => {
  let token
  let domainRef
  let domainFromDB

  before(async () => await routr.connect())

  it('Create domain', done => {
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
      .resourceType('domains')
      .create(domain)
      .then(ref => {
        domainRef = ref
        done()
      })
      .catch(err => done(err))
  })

  it('Get domain', done => {
    routr
      .resourceType('domains')
      .get(domainRef)
      .then(domain => {
        domainFromDB = domain
        assert.ok(domain.metadata.name === 'Test Domain')
        done()
      })
      .catch(err => done(err))
  })

  it('List domains', done => {
    routr
      .resourceType('domains')
      .list()
      .then(domains => {
        assert.ok(domains.length > 0)
        done()
      })
      .catch(err => done(err))
  })

  it('Update domain', done => {
    domainFromDB.metadata.name = 'Test Domain Changed'
    routr
      .resourceType('domains')
      .update(domainFromDB)
      .then(ref => {
        done()
      })
      .catch(err => done(err))
  })

  it('Delete domain', done => {
    routr
      .resourceType('domains')
      .del(domainFromDB.metadata.ref)
      .then(() => {
        done()
      })
      .catch(err => done(err))
  })

  it('Test bad use of resource builder', done => {
    try {
      const agent = new ResourceBuilder(Kind.AGENT, 'Test Agent')
        .withCredentials()
        .withEgressPolicy('.*', 'GW001')
        .build()
      console.log(JSON.stringify(agent, null, ' '))
      done('not good')
    } catch (err) {
      done()
    }
  })
})
