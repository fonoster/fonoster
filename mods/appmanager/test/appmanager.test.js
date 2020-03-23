const AppManager = require('../src/appmanager')
const assert = require('assert')
const { updateBucketPolicy } = require('@yaps/core')
const path = require('path')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('App Manager Service', () => {
  let appmanager

  before(async () => {
    // This will create the bucket if it does not exist
    await updateBucketPolicy('apps')

    appmanager = new AppManager({
      endpoint: `${process.env.APISERVER_ENDPOINT}`,
      bucket: 'apps'
    })
  })

  it('Create app bad dir path field', done => {
    const path = __dirname + '/../etc/hello-money'

    appmanager
      .deployApp(path)
      .then(r => done('should enter here'))
      .catch(err => {
        assert.ok(err.message.includes('Unable to open project'))
        done()
      })
  })

  it('Deploy app perfect case...', done => {
    const path = __dirname + '/../etc/hello-monkeys'

    appmanager
      .deployApp(path)
      .then(app => {
        assert.equal(app.getName(), 'hello-monkeys')
        done()
      })
      .catch(err => done(err))
  })

  it('List apps', done => {
    appmanager
      .listApps({ pagSize: 10, pview: 0, pageToken: '0' })
      .then(result => {
        assert.ok(result.getAppsList().length > 0)
        done()
      })
      .catch(err => done(err))
  })

  it('Get app', done => {
    appmanager
      .getApp('hello-monkeys')
      .then(app => {
        assert.ok(app.getName() === 'hello-monkeys')
        done()
      })
      .catch(err => done(err))
  })

  it('Get app no yet register', done => {
    appmanager
      .getApp('hello-money')
      .then(app => {
        done('should not enter here')
      })
      .catch(err => {
        assert.ok(err.message.includes('does not exist'))
        done()
      })
  })

  it('Delete app', done => {
    appmanager
      .deleteApp('hello-monkeys')
      .then(() => {
        done()
      })
      .catch(err => done(err))
  })

  it('Delete app not yet register', done => {
    appmanager
      .deleteApp('hello-moneys')
      .then(() => {
        done('should not enter here')
      })
      .catch(err => {
        assert.ok(err.message.includes('does not exist'))
        done()
      })
  })
})
