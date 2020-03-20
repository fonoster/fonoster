const AppManager = require('../src/appmanager')
const assert = require('assert')

if(process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV ) {
    require('dotenv').config({ path: __dirname + '/../../.env' })
}

describe('App Manager Service', () => {
    let appmanager

    before(() => {
        appmanager = new AppManager({
            endpoint: `${process.env.APISERVER_ENDPOINT}`,
            bucket: 'apps'
        })
    })

    it.only('Create app bad dir path field', done => {
        const path = __dirname + '/../etc/hello-money'

        appmanager.deployApp(path)
        .then(r => done('should enter here'))
        .catch(err => {
            assert.ok(err.message.includes('Unable to open project'))
            done()
        })
    })

    it.only('Deploy app perfect case...', done => {
        const path = __dirname + '/../etc/hello-monkeys'

        appmanager.deployApp(path)
        .then(app => {
            assert.equal(app.getName(), 'hello-monkeys')
            done()
        }).catch(err => done(err))
    })

    it.skip('List apps', done => {
        appmanager.listApps({pagSize: 1, pageToken: '?', view: 0})
        .then(result => {
            assert.ok(result.getAppsList().length > 0)
            done()
        }).catch(err => done(err))
    })

    it('Get app', done => {
        appmanager.getApp('hello-monkeys')
        .then(app => {
            assert.ok(app.getName() === 'hello-monkeys')
            done()
        }).catch(err => done(err))
    })

    it.only('Get app no yet register', done => {
        appmanager.getApp('hello-money')
        .then(app => {
            done('should not enter here')
        }).catch(err => {
            assert.ok(err.message.includes('does not exist'))
            done()
        })
    })

    it.only('Delete app', done => {
        appmanager.deleteApp('hello-monkeys')
        .then(() => {
            done()
        }).catch(err => done(err))
    })

    it.only('Delete app not yet register', done => {
        appmanager.deleteApp('hello-moneys')
        .then(() => {
            done('should not enter here')
        }).catch(err => {
            assert.ok(err.message.includes('does not exist'))
            done()
        })
    })

})
