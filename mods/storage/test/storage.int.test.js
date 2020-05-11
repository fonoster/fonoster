const { Storage } = require('../src/storage')
const { StoragePB } = require('@fonos/core')
const { updateBucketPolicy } = require('@fonos/core')
const assert = require('assert')
const path = require('path')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('Storage Service', () => {
  let storage

  before(async () => {
    // This will create the bucket if it does not exist
    await updateBucketPolicy('default')

    storage = new Storage({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
  })

  it('Upload object with bad argument', done => {
    // Will fail because of bad argument filenam
    storage
      .uploadObject({
        filenam: __dirname + '/../etc/hello-monkeys.tgz',
        bucket: 'default'
      })
      .then(result => {
        done('should not enter here')
      })
      .catch(e => {
        assert.ok(e.message.includes('name is required'))
        // Expected to enter gere
        done()
      })
  })

  it('Upload object with bad bucket', done => {
    // Will fail for directories
    storage
      .uploadObject({
        filename: __dirname + '/../etc/hello-monkeys.tgz',
        bucket: 'bucket001'
      })
      .then(result => done('should not enter here'))
      .catch(err => {
        assert.ok(err.message.includes('bucket does not exist'))
        done()
      })
  })

  it('Uploading a directory', done => {
    // Will fail for directories
    storage
      .uploadObject({
        filename: __dirname,
        bucket: 'default'
      })
      .then(result => {
        done('should not enter here')
      })
      .catch(e => {
        assert.ok(e.message.includes('is not supported'))
        done()
      })
  })

  it('Upload a single compress(tar) file', done => {
    // Will pass
    storage
      .uploadObject({
        filename: __dirname + '/../etc/hello-monkeys.tgz',
        bucket: 'default',
        metadata: {
          contentType: 'text/html'
        }
      })
      .then(result => {
        // Asserted this way to prevent issue with size changes
        // different filesystems
        assert.ok(result.getSize() > 0)
        done()
      })
      .catch(e => {
        done(e)
      })
  })

  it('Upload a single uncompress file', done => {
    // Will pass
    storage
      .uploadObject({
        filename: __dirname + '/../etc/test.txt',
        bucket: 'default'
      })
      .then(result => {
        // Asserted this way to prevent issue with size changes
        // different filesystems
        assert.ok(result.getSize() > 0)
        done()
      })
      .catch(e => {
        done(e)
      })
  })

  it('Get object url not found', done => {
    storage
      .getObjectURL({ name: 'test.wav', bucket: 'default' })
      .then(result => done('should enter here'))
      .catch(e => {
        assert.ok(e.message.includes('Not Found'))
        done()
      })
  })

  it('Get object url', done => {
    storage
      .getObjectURL({ name: 'test.txt', bucket: 'default' })
      .then(result => {
        assert.ok(result.includes('/default/test.txt'))
        done()
      })
      .catch(e => done(e))
  })

  it('Get object url sync', done => {
    const Fiber = require('fibers')
    Fiber(() => {
      const url = storage.getObjectURLSync({
        name: 'test.txt',
        bucket: 'default'
      })
      assert.ok(url.includes('test.txt'))
      done()
    }).run()
  })
})
