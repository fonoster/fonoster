/**
 * @author Pedro Sanders
 * @since v1
 */
const {
    auth
} = require('../common/trust_util')
const redis = require('./redis')
const objectid = require('objectid')
const appmanager = require('../schemas/appmanager.schema')
const Minio = require('minio')
const path = require('path')
const walk = require('walk')

const minioClient = new Minio.Client({
      endPoint: '127.0.0.1',
      port: 9000,
      useSSL: false,
      accessKey: 'minio',
      secretKey: 'minio123'
})

const listApps = (call, callback) => {
    try {
       auth(call)
    } catch(e) {
       console.error(e)
       callback(new Error('UNAUTHENTICATED'), null)
       return
    }

    const data = { apps: [
        { ref: 'hello-world', name: 'hello-world', description:
          'Simple voice application'},
        { ref: 'presidential-poll', name: 'presidential-poll',
          description: 'Advance example'}
    ]}

    callback(null, data)
}

const getApp = (call, callback) => {
    try {
        auth(call)
    } catch(e) {
       callback(new Error('UNAUTHENTICATED'), null)
       return
    }

    const app = { ref: 'hello-world', name: 'hello-world',
        description: 'Simple voice application'}
    callback(null, app)
}

const createApp = (call, callback) => {
    try {
        auth(call)
    } catch(e) {
       console.log(e)
       callback(new Error('UNAUTHENTICATED'), null)
       return
    }

    // Validating the request
    const errors = appmanager.createAppRequest.validate({
        filePath: call.request.getFilePath(),
        app: {
            name: call.request.getApp().getName(),
            description: call.request.getApp().getDescription(),
        }
    })

    if(errors.length > 0) {
        callback(new Error('INVALID_ARGUMENT'), errors[0].message)
        return
    }

    console.log('Uploading file')

    const uploadFolder = call.request.getFilePath()
    const dirCount = path.dirname(uploadFolder).split(path.sep).length
    const baseDir = path.dirname(uploadFolder)
      .split(path.sep).slice(0, dirCount).join('/')

    const walker = walk.walk(uploadFolder)
    walker.on('file', (root, fileStats, next) => {
        const filePath = root + '/' + fileStats.name
        const dest = filePath.substring(baseDir.length + 1)

        minioClient.fPutObject('default', dest , filePath, err => {

            if (err) {
              console.error(err)
            }
            next()
        })
    })

    const app = call.request.getApp()
    app.setRef(objectid())
    app.setStatus(0) // TODO: Get from enum value

    redis.call('JSON.set', app.getRef(), '.', `${JSON.stringify(app.toString())}`)
    .then(result => callback(null, app))
    .catch(e => callback(new Error(e)))
}

const updateApp = (call, callback) => {
    try {
        auth(call)
    } catch(e) {
       callback(new Error('UNAUTHENTICATED'), null)
       return
    }
    console.log(`updating app with ref: ${JSON.stringify(call.request)}`)
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
    console.log(`deleting app with ref: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
}

module.exports.listApps = listApps
module.exports.getApp = getApp
module.exports.createApp = createApp
module.exports.updateApp = updateApp
module.exports.deleteApp = deleteApp
