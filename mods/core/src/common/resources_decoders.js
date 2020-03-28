const { Domain } = require('../server/protos/domains_pb')
const { Number } = require('../server/protos/numbers_pb')

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

module.exports.domainDecoder = domainDecoder
module.exports.numberDecoder = numberDecoder
