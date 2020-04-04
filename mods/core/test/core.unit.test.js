const StoragePB = require('../src/server/protos/storage_pb')
const { mapToObj } = require('../src/common/utils')
const expect = require('chai').expect

describe('Core', () => {
  it('Convert grpc map to json obj', () => {
    const uor = new StoragePB.UploadObjectRequest()
    const t = mapToObj(uor.getMetadataMap())
    expect(t).to.be.deep.equal({})

    uor.getMetadataMap().set('var', 'foo')
    uor.getMetadataMap().set('var2', 'foo2')

    const c = mapToObj(uor.getMetadataMap())
    expect(c.var).to.be.equal('foo')
  })
})
