/**
 * @author Pedro Sanders
 * @since v1
 */
const AppManager = require('../src/appmanager')
const assert = require('assert')

if(process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV ) {
    require('dotenv').config({ path: __dirname + '/../../.env.dev' })
}

describe('App Manager Service', () => {
    let appmanager

    before(() => {
        appmanager = new AppManager({
            endpoint: `${process.env.APISERVER_ENDPOINT}`
        })
    })

    it('List Apps', done => {
        appmanager.listApps()
        .then(result => {
            assert.ok(result.apps.length > 1)
            done()
        }).catch(e => done(e))
    })

    it('Get App', done => {
        appmanager.getApp('hello-world')
        .then(app => {
            assert.ok(app.name === 'hello-world')
            done()
        }).catch(e => done(e))
    })

    it.only('Create App', async() => {
        const request = {
            dirPath: __dirname + '/../etc/hello-monkeys',
            app: {
                name: 'hello-monkeys',
                description: 'Simple Voice App'
            }
        }

        const app = await appmanager.createApp(request)
        assert.ok(app.getName() === 'hello-monkeys')
    })

    it('Update App', done => {
        const data = {
          app: {
              status: 'STOPPED'
          }
        }
        appmanager.updateApp(data)
        .then(app => {
            assert.ok(app.status === 'STOPPED')
            done()
        }).catch(e => done(e))
    })

    it('Delete App', done => {
        appmanager.deleteApp('hello-world')
        .then(result => {
            done()
        }).catch(e => done(e))
    })

})
