const { Domain } = require('../server/protos/domains_pb')

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

module.exports.domainDecoder = domainDecoder
