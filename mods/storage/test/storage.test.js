/**
 * @author Pedro Sanders
 * @since v1
 */
const Storage = require('../src/storage')
const assert = require('assert')

if(process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV ) {
    require('dotenv').config({ path: __dirname + '/../../.env.dev' })
}

describe('Storage Service', () => {
    let storage

    before(() => {
        storage = new Storage({
            endpoint: `${process.env.APISERVER_ENDPOINT}`
        })
    })

    it('Upload object with bad argument', done => {
        // Will fail because of bad argument filenam
        storage.uploadObject({
            filenam: __dirname + '/../etc/hello-monkeys.zip',
            bucket: 'default'
        }).then(result => {
            done('should not enter here')
        }).catch(e => {
            assert.ok(e.message.includes('name is required'))
            // Expected to enter gere
            done()
        })
    })

    it('Upload object with bad bucket', done => {
        // Will fail for directories
        storage.uploadObject({
            filename: __dirname + '/../etc/hello-monkeys.zip',
            bucket: 'bucket001'
        }).then(result => {
            done('should not enter here')
        }).catch(e => {
            assert.ok(e.message.includes('bucket does not exist'))
            // Expected to enter gere
            done()
        })
    })

    it('Uploading a directory', done => {
        // Will fail for directories
        storage.uploadObject({
            filename: __dirname,
            bucket: 'default'
        }).then(result => {
            done('should not enter here')
        }).catch(e => {
            assert.ok(e.message.includes('is not supported'))
            done()
        })
    })

    it('Upload a single compress(zip) file', done => {
        // Will pass
        storage.uploadObject({
            filename: __dirname + '/../etc/hello-monkeys.zip',
            bucket: 'default'
        }).then(result => {
            // Asserted this way to prevent issue with size changes
            // different filesystems
            assert.ok(result.getSize() > 0)
            done()
        }).catch(e => {
            done(e)
        })
    })

    it('Upload a single uncompress file', done => {
        // Will pass
        storage.uploadObject({
            filename: __dirname + '/../etc/test.txt',
            bucket: 'default'
        }).then(result => {
            // Asserted this way to prevent issue with size changes
            // different filesystems
            assert.ok(result.getSize() > 0)
            done()
        }).catch(e => {
            done(e)
        })
    })

})
