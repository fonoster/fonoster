const Providers = require('../src/providers')
const assert = require('assert')
const path = require('path')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('Providers Service', () => {
  let providers
  let providerRef

  before(() => {
    providers = new Providers({
      endpoint: `${process.env.APISERVER_ADDR}`
    })
  })

  it.skip('Create provider with invalid argument', done => {
    providers
      .createProvider({
        name: 'Provider #1',
        username: 'test',
        secret: '1234',
        host: 'sip3.provider.net',
        transport: 'lcp' // Really?
      })
      .then(r => done('not good'))
      .catch(err => {
        console.log(err)
        assert.ok(err.message.includes('INVALID_ARGUMENT'))
        done()
      })
  })

  it('Create provider', done => {
    providers
      .createProvider({
        name: 'Provider #1',
        username: 'test',
        secret: '1234',
        host: 'sip.provider.net',
        transport: 'tcp' // Really?
      })
      .then(provider => {
        providerRef = provider.getRef()
        assert.ok(provider.getName() === 'Provider #1')
        done()
      })
      .catch(e => {
        done(e)
      })
  })

  it('Provider already exist', done => {
    providers
      .createProvider({
        name: 'Provider #1',
        username: 'test',
        secret: '1234',
        host: 'sip.provider.net', // This combine with transport must be unique
        transport: 'tcp'
      })
      .then(r => done('not good'))
      .catch(err => {
        assert.ok(err.message.includes('FAILED_PRECONDITION'))
        done()
      })
  })

  it('List providers', done => {
    providers
      .listProviders({ pageSize: 10, pageToken: '0', view: 0 })
      .then(result => {
        assert.ok(result.getProvidersList().length > 0)
        done()
      })
      .catch(err => done(err))
  })

  it('Get provider by reference', done => {
    providers
      .getProvider(providerRef)
      .then(provider => {
        assert.ok(provider.getRef() === providerRef)
        done()
      })
      .catch(err => done(err))
  })

  it('Update provider perfect case...', done => {
    const provider = {
      ref: providerRef,
      name: 'Provider #2',
      secret: '1234',
      host: 'sip.provider.net', // This combine with transport must be unique
      transport: 'udp'
    }

    providers
      .updateProvider(provider)
      .then(providerFromDB => {
        assert.ok(provider.ref === providerFromDB.getRef())
        done()
      })
      .catch(err => done(err))
  })

  it('Delete provider', done => {
    providers
      .deleteProvider(providerRef)
      .then(() => done())
      .catch(err => done(err))
  })

  it('Provider reference does not exist', done => {
    providers
      .deleteProvider('1234')
      .then(() => done('not good'))
      .catch(err => {
        assert.ok(err.message.includes('NOT_FOUND'))
        done()
      })
  })
})
