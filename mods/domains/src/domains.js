const { logger } = require('@yaps/core')
const { AbstractService, DomainsService, DomainsPB } = require('@yaps/core')
const promisifyAll = require('grpc-promise').promisifyAll

class Domains extends AbstractService {
  constructor (options) {
    super(options, DomainsService.DomainsClient)
    promisifyAll(super.getService(), { metadata: super.getMeta() })
  }

  async createDomain (request) {
    logger.log(
      'verbose',
      `@yaps/domains createDomain [request: ${JSON.stringify(request)}]`
    )

    const domain = new DomainsPB.Domain()
    domain.setName(request.name)
    domain.setDomainUri(request.domainUri)
    domain.setEgressRule(request.egressRule)
    domain.setEgressNumberRef(request.egressNumberRef)
    domain.setAccessDenyList(request.accessDeny)
    domain.setAccessAllowList(request.accessAllow)

    const req = new DomainsPB.CreateDomainRequest()
    req.setDomain(domain)

    return super
      .getService()
      .createDomain()
      .sendMessage(req)
  }
}

module.exports = Domains
