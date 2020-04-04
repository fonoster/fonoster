/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the routr decoders
 */
const chai = require('chai')
const expect = chai.expect

describe('@yaps/core/common/decoders/agent_decoder', () => {
  context('agent decoder', () => {
    const decoder = require('../src/common/decoders/agent_decoder')
    it('should create an agent object from a json object', () => {
      const jsonObj = {
        metadata: {
          ref: '001',
          name: 'Peter',
          createdOn: 'DATE',
          modifiedOn: 'DATE'
        },
        spec: {
          credentials: {
            username: 'peter',
            secret: 'secret'
          },
          domains: ['sip.local']
        }
      }
      const agent = decoder(jsonObj)
      expect(agent.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(agent.getName()).to.be.equal(jsonObj.metadata.name)
      expect(agent.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(agent.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn)
      expect(agent.getUsername()).to.be.equal(jsonObj.spec.credentials.username)
      expect(agent.getSecret()).to.be.equal(jsonObj.spec.credentials.secret)
      expect(agent.getDomainsList())
        .to.be.a('array')
        .lengthOf(1)
    })
  })

  context('domain decoder', () => {
    let jsonObj
    const decoder = require('../src/common/decoders/domain_decoder')

    beforeEach(() => {
      jsonObj = {
        metadata: {
          ref: '001',
          name: 'Peter',
          createdOn: 'DATE',
          modifiedOn: 'DATE'
        },
        spec: {
          context: {
            domainUri: 'sip.local',
            egressPolicy: {
              rule: '.*',
              numberRef: '001'
            },
            accessControlList: {
              allow: ['192.168.1.1', '10.0.0.1'],
              deny: ['0.0.0.0/31']
            }
          }
        }
      }
    })

    it('should create a domain object from a json object w/ no acl', () => {
      delete jsonObj.spec.context.accessControlList
      const domains = decoder(jsonObj)
      expect(domains.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(domains.getName()).to.be.equal(jsonObj.metadata.name)
      expect(domains.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(domains.getEgressRule()).to.be.equal(
        jsonObj.spec.context.egressPolicy.rule
      )
      expect(domains.getEgressNumberRef()).to.be.equal(
        jsonObj.spec.context.egressPolicy.numberRef
      )
      expect(domains.getAccessDenyList())
        .to.be.a('array')
        .lengthOf(0)
      expect(domains.getAccessAllowList())
        .to.be.a('array')
        .lengthOf(0)
    })

    it('should create a domain object from a json object w/ no egress policy', () => {
      delete jsonObj.spec.context.egressPolicy
      const domains = decoder(jsonObj)
      expect(domains.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(domains.getName()).to.be.equal(jsonObj.metadata.name)
      expect(domains.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(domains.getEgressRule())
        .to.be.a('string')
        .lengthOf(0)
      expect(domains.getEgressNumberRef())
        .to.be.a('string')
        .lengthOf(0)
      expect(domains.getAccessDenyList())
        .to.be.a('array')
        .lengthOf(1)
      expect(domains.getAccessAllowList())
        .to.be.a('array')
        .lengthOf(2)
    })

    it('should create a domain object from a json object', () => {
      const domains = decoder(jsonObj)
      expect(domains.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(domains.getName()).to.be.equal(jsonObj.metadata.name)
      expect(domains.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(domains.getEgressRule()).to.be.equal(
        jsonObj.spec.context.egressPolicy.rule
      )
      expect(domains.getEgressNumberRef()).to.be.equal(
        jsonObj.spec.context.egressPolicy.numberRef
      )
      expect(domains.getAccessDenyList())
        .to.be.a('array')
        .lengthOf(1)
      expect(domains.getAccessAllowList())
        .to.be.a('array')
        .lengthOf(2)
    })
  })

  context('domain decoder', () => {
    let jsonObj
    const decoder = require('../src/common/decoders/domain_decoder')

    beforeEach(() => {
      jsonObj = {
        metadata: {
          ref: '001',
          name: 'Peter',
          createdOn: 'DATE',
          modifiedOn: 'DATE'
        },
        spec: {
          context: {
            domainUri: 'sip.local',
            egressPolicy: {
              rule: '.*',
              numberRef: '001'
            },
            accessControlList: {
              allow: ['192.168.1.1', '10.0.0.1'],
              deny: ['0.0.0.0/31']
            }
          }
        }
      }
    })

    it('should create a domain object from a json object w/ no acl', () => {
      delete jsonObj.spec.context.accessControlList
      const domains = decoder(jsonObj)
      expect(domains.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(domains.getName()).to.be.equal(jsonObj.metadata.name)
      expect(domains.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(domains.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn)
      expect(domains.getEgressRule()).to.be.equal(
        jsonObj.spec.context.egressPolicy.rule
      )
      expect(domains.getEgressNumberRef()).to.be.equal(
        jsonObj.spec.context.egressPolicy.numberRef
      )
      expect(domains.getAccessDenyList())
        .to.be.a('array')
        .lengthOf(0)
      expect(domains.getAccessAllowList())
        .to.be.a('array')
        .lengthOf(0)
    })

    it('should create a domain object from a json object w/ no egress policy', () => {
      delete jsonObj.spec.context.egressPolicy
      const domains = decoder(jsonObj)
      expect(domains.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(domains.getName()).to.be.equal(jsonObj.metadata.name)
      expect(domains.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(domains.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn)
      expect(domains.getEgressRule())
        .to.be.a('string')
        .lengthOf(0)
      expect(domains.getEgressNumberRef())
        .to.be.a('string')
        .lengthOf(0)
      expect(domains.getAccessDenyList())
        .to.be.a('array')
        .lengthOf(1)
      expect(domains.getAccessAllowList())
        .to.be.a('array')
        .lengthOf(2)
    })

    it('should create a domain object from a json object', () => {
      const domains = decoder(jsonObj)
      expect(domains.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(domains.getName()).to.be.equal(jsonObj.metadata.name)
      expect(domains.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(domains.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn)
      expect(domains.getEgressRule()).to.be.equal(
        jsonObj.spec.context.egressPolicy.rule
      )
      expect(domains.getEgressNumberRef()).to.be.equal(
        jsonObj.spec.context.egressPolicy.numberRef
      )
      expect(domains.getAccessDenyList())
        .to.be.a('array')
        .lengthOf(1)
      expect(domains.getAccessAllowList())
        .to.be.a('array')
        .lengthOf(2)
    })
  })

  context('number decoder', () => {
    let jsonObj
    const decoder = require('../src/common/decoders/number_decoder')

    beforeEach(() => {
      jsonObj = {
        metadata: {
          ref: '001',
          gwRef: '1001',
          createdOn: 'DATE',
          modifiedOn: 'DATE',
          ingressApp: 'hello-monkeys'
        },
        spec: {
          location: {
            telUrl: 'tel:17853178070'
          }
        }
      }
    })

    it('should create a number object from a json object', () => {
      const number = decoder(jsonObj)
      expect(number.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(number.getProviderRef()).to.be.equal(jsonObj.metadata.gwRef)
      expect(number.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(number.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn)
      expect(number.getIngressApp()).to.be.equal(jsonObj.metadata.ingressApp)
      expect(number.getE164Number()).to.be.equal(
        jsonObj.spec.location.telUrl.split(':')[1]
      )
    })

    it('should create a number object from without ingress app', () => {
      delete jsonObj.metadata.ingressApp
      const number = decoder(jsonObj)
      expect(number.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(number.getProviderRef()).to.be.equal(jsonObj.metadata.gwRef)
      expect(number.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(number.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn)
      expect(number.getIngressApp())
        .to.be.a('string')
        .lengthOf(0)
      expect(number.getE164Number()).to.be.equal(
        jsonObj.spec.location.telUrl.split(':')[1]
      )
    })
  })

  context('provider decoder', () => {
    let jsonObj
    const decoder = require('../src/common/decoders/provider_decoder')

    beforeEach(() => {
      jsonObj = {
        metadata: {
          ref: '001',
          name: 'provider002',
          createdOn: 'DATE',
          modifiedOn: 'DATE'
        },
        spec: {
          host: '127.0.0.1',
          transport: 'tcp',
          expires: 0,
          credentials: {
            username: 'trunk001',
            secret: '1234'
          }
        }
      }
    })

    it('should create a provider object from a json object', () => {
      const provider = decoder(jsonObj)
      expect(provider.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(provider.getName()).to.be.equal(jsonObj.metadata.name)
      expect(provider.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(provider.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn)
      expect(provider.getHost()).to.be.equal(jsonObj.spec.host)
      expect(provider.getTransport()).to.be.equal(jsonObj.spec.transport)
      expect(provider.getExpires()).to.be.equal(jsonObj.spec.expires)
      expect(provider.getUsername()).to.be.equal(
        jsonObj.spec.credentials.username
      )
      expect(provider.getSecret()).to.be.equal(jsonObj.spec.credentials.secret)
    })

    it('should create a provider object from a json object without credentials', () => {
      delete jsonObj.spec.credentials
      const provider = decoder(jsonObj)
      expect(provider.getRef()).to.be.equal(jsonObj.metadata.ref)
      expect(provider.getName()).to.be.equal(jsonObj.metadata.name)
      expect(provider.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn)
      expect(provider.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn)
      expect(provider.getHost()).to.be.equal(jsonObj.spec.host)
      expect(provider.getTransport()).to.be.equal(jsonObj.spec.transport)
      expect(provider.getExpires()).to.be.equal(jsonObj.spec.expires)
      expect(provider.getUsername())
        .to.be.a('string')
        .lengthOf(0)
      expect(provider.getSecret())
        .to.be.a('string')
        .lengthOf(0)
    })
  })
})
