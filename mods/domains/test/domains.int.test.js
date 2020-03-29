const Domains = require('../src/domains')
const assert = require('assert')
const path = require('path')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('Domains Service', () => {
  let domains
  let domainRef

  before(() => {
    domains = new Domains({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
  })

  it('Create domain perfect case...', done => {
    const domain = {
      name: 'Local Domain',
      domainUri: 'test.local'
    }

    domains
      .createDomain(domain)
      .then(domain => {
        domainRef = domain.getRef()
        done()
      })
      .catch(err => done(err))
  })

  it('List domains', done => {
    domains
      .listDomains({ pageSize: 10, pageToken: '0', view: 0 })
      .then(result => {
        assert.ok(result.getDomainsList().length > 0)
        done()
      })
      .catch(err => done(err))
  })

  it('Domains missing domainUri', done => {
    const domain = {
      name: 'Local Domain'
    }

    domains
      .createDomain(domain)
      .then(r => done('not good'))
      .catch(err => {
        assert.ok(err.message.includes('FAILED_PRECONDITION'))
        done()
      })
  })

  it('Domain already exists', done => {
    const domain = {
      name: 'Local Domain',
      domainUri: 'test.local'
    }

    domains
      .createDomain(domain)
      .then(r => done('not good'))
      .catch(err => {
        assert.ok(err.message.includes('ALREADY_EXISTS'))
        done()
      })
  })

  it('Get domain by reference', done => {
    domains
      .getDomain(domainRef)
      .then(domain => {
        assert.ok(domain.getRef() === domainRef)
        done()
      })
      .catch(err => done(err))
  })

  it('Update domain perfect case...', done => {
    const domain = {
      ref: domainRef,
      name: 'Local Domain2'
    }

    domains
      .updateDomain(domain)
      .then(domainFromDB => {
        assert.ok(domain.name === domainFromDB.getName())
        done()
      })
      .catch(err => done(err))
  })

  it('Delete domain', done => {
    domains
      .deleteDomain(domainRef)
      .then(() => done())
      .catch(err => done(err))
  })

  it('Domain reference does not exist', done => {
    domains
      .deleteDomain('1234')
      .then(() => done('not good'))
      .catch(err => {
        assert.ok(err.message.includes('NOT_FOUND'))
        done()
      })
  })
})
