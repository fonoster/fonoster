const { Domain } = require('../server/protos/domains_pb')
const { Number } = require('../server/protos/numbers_pb')
const { Provider } = require('../server/protos/providers_pb')

const domainDecoder = jsonObj => {
  const domain = new Domain()
  const context = jsonObj.spec.context
  domain.setRef(jsonObj.metadata.ref)
  domain.setName(jsonObj.metadata.name)
  domain.setDomainUri(context.domainUri)
  domain.setCreateTime(jsonObj.metadata.createdOn)
  domain.setUpdateTime(jsonObj.metadata.modifiedOn)
  if (context.egressPolicy) {
    domain.setEgressRule(context.egressPolicy.rule)
    domain.setEgressNumberRef(context.egressPolicy.numberRef)
  }

  const acl = context.accessControlList

  if (acl && acl.allow) domain.setAccessDenyList(acl.allow)
  if (acl && acl.deny) domain.setAccessAllowList(acl.deny)

  return domain
}

const providerDecoder = jsonObj => {
  const provider = new Provider()
  const spec = jsonObj.spec
  provider.setRef(jsonObj.metadata.ref)
  provider.setName(jsonObj.metadata.name)
  provider.setHost(spec.host)
  provider.setTransport(spec.transport)
  provider.setExpires(spec.expires)  
  if (spec.credentials) {
    provider.setUsername(spec.credentials.username)
    provider.setSecret(spec.credentials.secret)
  }
  provider.setCreateTime(jsonObj.metadata.createdOn)
  provider.setUpdateTime(jsonObj.metadata.modifiedOn)
  return provider
}

const numberDecoder = jsonObj => {
  const number = new Number()
  const location = jsonObj.spec.location
  number.setRef(jsonObj.metadata.ref)
  number.setProviderRef(jsonObj.metadata.gwRef)
  number.setIngressApp(jsonObj.metadata.ingressApp)
  number.setE164Number(location.telUrl.split(':')[1])
  number.setCreateTime(jsonObj.metadata.createdOn)
  number.setUpdateTime(jsonObj.metadata.modifiedOn)
  return number
}

module.exports.providerDecoder = providerDecoder
module.exports.domainDecoder = domainDecoder
module.exports.numberDecoder = numberDecoder
