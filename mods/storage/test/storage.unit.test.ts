import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'
import updateBucketPolicy from '@fonos/core/dist/common/fsutils'
import Storage from '../src/storage'
import Fiber from 'fibers'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: join(__dirname, '..', '..', '..', '.env') })
}

describe('Storage Service', () => {
  let storage: Storage

  before(async () => {
    // This will create the bucket if it does not exist
    await updateBucketPolicy('default')

    storage = new Storage({
      endpoint: `${process.env.APISERVER_ADDR}`
    })
  })

  /*it('Upload object with bad argument', done => {
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
  })*/

  it('fails because url was not found', () => {
    expect(
      storage.getObjectURL({ name: 'test.wav', bucket: 'default' })
    ).to.eventually.rejectedWith("filename 'test.wav' in bucket 'default'")
  })

  it('gets object url', () => {
    const p = storage.getObjectURL({ name: 'test.txt', bucket: 'default' })
    expect(p).to.eventually.include('/default/test.txt')
  })

  it('gets object url sync', () => {
    Fiber(() => {
      const url = storage.getObjectURLSync({
        name: 'test.txt',
        bucket: 'default'
      })
      expect(url).to.include('test.txt')
    }).run()
  })
})
