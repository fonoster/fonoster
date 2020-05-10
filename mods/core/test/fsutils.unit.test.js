/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the Service class
 */
const logger = require('../dist/common/logger')
logger.transports.forEach(t => (t.silent = true))
const chai = require('chai')
const sinon = require('sinon')
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const expect = chai.expect
var sandbox = sinon.createSandbox()

describe('@yaps/core/fsutils', () => {
  context('create new bucket', () => {
    let makeBucketWasCalled, setBucketPolicyCalled, createNewBucket
    var fsInstance = sinon
      .stub(require('../dist/common/utils'), 'fsInstance')
      .returns({
        bucketExists: () => false,
        makeBucket: () =>
          new Promise(resolve => {
            makeBucketWasCalled = true
            resolve()
          }),
        setBucketPolicy: () =>
          new Promise(resolve => {
            setBucketPolicyCalled = true
            resolve()
          })
      })
    createNewBucket = require('../dist/common/fsutils')

    beforeEach(() => {})

    afterEach(() => {
      sandbox.restore()
    })

    it('should not throw', async () => {
      await createNewBucket('test')
      expect(fsInstance).to.have.been.calledOnce
      expect(makeBucketWasCalled).to.be.true
      expect(setBucketPolicyCalled).to.be.true
      fsInstance.restore()
    })

    it.skip('should throw connectivity error', async () => {
      fsInstance.makeBucket = () =>
        new Promise((resolve, reject) => {
          reject(new Error('Connection error'))
        })
      const createNewBucket = require('../dist/common/fsutils')
      await expect(createNewBucket('test')).to.be.rejectedWith(
        'Connection error'
      )
    })
  })
})
