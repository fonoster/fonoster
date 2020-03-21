const assert = require('assert')
const StoragePB = require('../src/server/protos/storage_pb')
const { mapToObj } = require('../src/common/utils')

describe('Core', () => {
  it('Convert grpc map to json obj', done => {
    const uor = new StoragePB.UploadObjectRequest()
    const t = mapToObj(uor.getMetadataMap())
    assert.equal(t.var, undefined)

    uor.getMetadataMap().set('var', 'foo')
    uor.getMetadataMap().set('var2', 'foo2')

    const c = mapToObj(uor.getMetadataMap())
    assert.equal(c.var, 'foo')

    done()
  })
})
