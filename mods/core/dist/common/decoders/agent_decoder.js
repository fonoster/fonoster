var Agent = require('../../server/protos/agents_pb').Agent
module.exports = function (jsonObj) {
  var agent = new Agent()
  var spec = jsonObj.spec
  agent.setRef(jsonObj.metadata.ref)
  agent.setName(jsonObj.metadata.name)
  agent.setUsername(spec.credentials.username)
  agent.setSecret(spec.credentials.secret)
  agent.setDomainsList(spec.domains)
  agent.setCreateTime(jsonObj.metadata.createdOn)
  agent.setUpdateTime(jsonObj.metadata.modifiedOn)
  return agent
}
//# sourceMappingURL=agent_decoder.js.map
