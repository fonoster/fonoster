var Provider = require('../../server/protos/providers_pb').Provider
module.exports = function (jsonObj) {
  var provider = new Provider()
  var spec = jsonObj.spec
  provider.setRef(jsonObj.metadata.ref)
  provider.setName(jsonObj.metadata.name)
  provider.setCreateTime(jsonObj.metadata.createdOn)
  provider.setUpdateTime(jsonObj.metadata.modifiedOn)
  provider.setHost(spec.host)
  provider.setTransport(spec.transport)
  provider.setExpires(spec.expires)
  if (spec.credentials) {
    provider.setUsername(spec.credentials.username)
    provider.setSecret(spec.credentials.secret)
  }
  return provider
}
//# sourceMappingURL=provider_decoder.js.map
