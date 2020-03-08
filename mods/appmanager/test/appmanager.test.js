/**
 * @author Pedro Sanders
 * @since v1
 */
const assert = require('assert')
const AppManager = require('../src/appmanager')
const appmanager = new AppManager()

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

    it('Create App', done => {
        const data = {
          filePath: './hello_world.tar.gz',
          app: {
              name: 'hello-world',
              description: '',
              status: 'CREATING'
          }
        }
        appmanager.createApp(data)
        .then(app => {
            assert.ok(app.name === 'hello-world')
            done()
        }).catch(e => done(e))
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
