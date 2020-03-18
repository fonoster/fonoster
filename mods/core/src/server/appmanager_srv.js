/**
 * @author Pedro Sanders
 * @since v1
 */
const AppManagerPB = require('./protos/appmanager_pb')
const {
    auth
} = require('../common/trust_util')
const redis = require('./redis')
const objectid = require('objectid')
const appmanager = require('../schemas/appmanager.schema')

const listApps = (call, callback) => {
    try {
       auth(call)
    } catch(e) {
       console.error(e)
       callback(new Error('UNAUTHENTICATED'), null)
       return
    }

    const app = new AppManagerPB.App()
    app.setName('Hello World')
    app.setDescription('Simple app')

    const response = new AppManagerPB.ListAppsResponse()
    response.addApps(app)

    callback(null, response)
}

const getApp = (call, callback) => {
    try {
        auth(call)
    } catch(e) {
        callback(new Error('UNAUTHENTICATED'), null)
        return
    }

    redis.call('get', call.request.getName())
    .then(result => {
        const app = new AppManagerPB.App(JSON.parse(result).array)
        callback(null, app)
    })
    .catch(e => callback(new Error(e)))
}

const createApp = async(call, callback) => {
    try {
        auth(call)
    } catch(e) {
       callback(new Error('UNAUTHENTICATED'), null)
       return
    }

    // Validating the request
    const errors = appmanager.createAppRequest.validate({
        app: {
            name: call.request.getApp().getName(),
            description: call.request.getApp().getDescription()
        }
    })

    if(errors.length > 0) {
        callback(new Error('INVALID_ARGUMENT'), errors[0].message)
        return
    }

    const app = call.request.getApp()
    app.setStatus(AppManagerPB.App.Status.CREATING)
    app.setCreateTime(new Date())
    app.setUpdateTime(new Date())

    await redis.call('sadd', 'apps', app.getName())
    // This feels very hacky
    await redis.call('set', app.getName(), `${JSON.stringify(app)}`)
    callback(null, app)
}

const updateApp = (call, callback) => {
    try {
        auth(call)
    } catch(e) {
       callback(new Error('UNAUTHENTICATED'), null)
       return
    }
    console.log(`updating app: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
}

const deleteApp = (call, callback) => {
    try {
        auth(call)
    } catch(e) {
       callback(new Error('UNAUTHENTICATED'), null)
       return
    }
    console.log(`deleting app: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
}

module.exports.listApps = listApps
module.exports.getApp = getApp
module.exports.createApp = createApp
module.exports.updateApp = updateApp
module.exports.deleteApp = deleteApp
