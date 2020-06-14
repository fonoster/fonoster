import { Agent } from "../../server/protos/agents_pb"

export default function(jsonObj: any) {
  const agent = new Agent()
  const spec = jsonObj.spec
  agent.setRef(jsonObj.metadata.ref)
  agent.setName(jsonObj.metadata.name)
  agent.setUsername(spec.credentials.username)
  agent.setSecret(spec.credentials.secret)
  agent.setDomainsList(spec.domains)
  agent.setCreateTime(jsonObj.metadata.createdOn)
  agent.setUpdateTime(jsonObj.metadata.modifiedOn)
  return agent
}
