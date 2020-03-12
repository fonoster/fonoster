/**
 * @author Pedro Sanders
 * @since v1
 */
const AppManager = require('../src/appmanager')
const appmanager = new AppManager({endpoint: 'localhost:50052'})
const assert = require('assert')

describe('App Manager Service', () => {

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
            filePath: './hello_world.tar.gz',
            app: {
                name: 'hello-world'
            }
        }

        try {
            await appmanager.createApp(request)
        } catch(e) {
            // Ignore. It is supposed to happen
        }

        request.app.description = 'Simple Voice App'

        const app = await appmanager.createApp(request)
        assert.ok(app.getName() === 'hello-world')
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
