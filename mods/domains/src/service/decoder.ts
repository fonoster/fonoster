/* eslint-disable require-jsdoc */
import { Domain } from "./protos/domains_pb";

export default function (jsonObj: any) {
  const domain = new Domain();
  const context = jsonObj?.spec?.context;

  domain.setRef(jsonObj.metadata.ref);
  domain.setName(jsonObj.metadata.name);
  domain.setDomainUri(context?.domainUri);
  domain.setCreateTime(jsonObj.metadata.createdOn);
  domain.setUpdateTime(jsonObj.metadata.modifiedOn);

  if (context.egressPolicy) {
    domain.setEgressRule(context.egressPolicy?.rule);
    domain.setEgressNumberRef(context.egressPolicy?.numberRef);
  }

  const acl = context?.accessControlList;

  if (acl && acl.allow) domain.setAccessAllowList(acl.allow);
  if (acl && acl.deny) domain.setAccessDenyList(acl.deny);

  return domain;
}
