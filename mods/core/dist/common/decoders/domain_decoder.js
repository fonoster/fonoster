var Domain = require('../../server/protos/domains_pb').Domain
module.exports = function (jsonObj) {
  var domain = new Domain()
  var context = jsonObj.spec.context
  domain.setRef(jsonObj.metadata.ref)
  domain.setName(jsonObj.metadata.name)
  domain.setDomainUri(context.domainUri)
  domain.setCreateTime(jsonObj.metadata.createdOn)
  domain.setUpdateTime(jsonObj.metadata.modifiedOn)
  if (context.egressPolicy) {
    domain.setEgressRule(context.egressPolicy.rule)
    domain.setEgressNumberRef(context.egressPolicy.numberRef)
  }
  var acl = context.accessControlList
  if (acl && acl.allow) domain.setAccessAllowList(acl.allow)
  if (acl && acl.deny) domain.setAccessDenyList(acl.deny)
  return domain
}
//# sourceMappingURL=domain_decoder.js.map
