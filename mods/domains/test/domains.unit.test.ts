import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import Domains from '../src/domains'
import chaiAsPromised from 'chai-as-promised'
import { DomainsPB, FonosService } from '@fonos/core'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

describe('@Fonos/domains', () => {

  afterEach(() => {
    sandbox.restore()
  })

  let domainsAPI = new Domains()

  const initStub = sandbox
  .stub(FonosService.prototype, 'init').returns()

  const serviceStub = sandbox
    .stub(FonosService.prototype, 'getService')
    .returns({
      createDomain: () => {
        return {
          sendMessage: () =>
            Promise.resolve({
              getRef: () => 'testref',
              getName: () => 'testname',
              getDomainUri: () => 'testdomain',
              getEgressRule: () => '*',
              getEgressNumberRef: () => '12345',
              getAccessDenyList: () => ['123'],
              getAccessAllowList: () => ['12'],
              getCreateTime: () => Date.now,
              getUpdateTime: () => Date.now
            })
        }
      }
    })

  it('should create a domain', async () => {
   
    const req = {
      name: 'testname',
      domainUri: 'testdomain',
      egressRule: '*',
      egressNumberRef: '12345'
    }

    let result = await domainsAPI.createDomain(req)

    expect(result).to.have.property('ref').to.be.equal('testref')
    expect(result).to.have.property('name').to.be.string
    expect(result).to.have.property('domainUri').to.be.string
    expect(result).to.have.property('egressRule').to.be.string
    expect(result).to.have.property('egressNumberRef').to.be.string    
  })

  it('should get a domain', async () => {
    const getDomainserviceStub = sandbox
    .stub(FonosService.prototype, 'getService')
    .returns({
      getDomain: () => {
        return {
          sendMessage: () =>
            Promise.resolve({
              getRef: () => 'testref',
              getName: () => 'testname',
              getDomainUri: () => 'testdomain',
              getEgressRule: () => '*',
              getEgressNumberRef: () => '12345',
              getAccessDenyList: () => ['123'],
              getAccessAllowList: () => ['12'],
              getCreateTime: () => Date.now,
              getUpdateTime: () => Date.now
            })
        }
      }
    })

    const request = 'testref'
    const res = await domainsAPI.getDomain(request)
    
    expect(res).to.have.property('ref').to.be.equal('testref')
    expect(res).to.have.property('name').to.be.equal('testname')
    expect(res).to.have.property('domainUri').to.be.string
    expect(res).to.have.property('egressRule').to.be.string
    expect(res).to.have.property('egressNumberRef').to.be.string

  })

  it('should delete a Domain', async () => {
    const serviceStub = sandbox
    .stub(FonosService.prototype, 'getService')
    .returns({
      deleteDomain: () => {
        return {
          sendMessage: () =>
            Promise.resolve({})
        }
      }
    })

    const request = 'testref';
    const res = await domainsAPI.deleteDomain(request)
    
    expect(serviceStub).to.have.been.calledOnce
    expect(res).to.be.a('object').empty
  })

  it('should list domains', async () => {
    const stubListDomains = sandbox
    .stub(FonosService.prototype, 'getService')
    .returns({
      listDomains: () => {
        return {
          sendMessage: (() => Promise.resolve({
              ref: 'testref',
              name: 'testname',
              domainUri: 'testdomain',
              egressRule: '*',
              egressNumberRef: '12345'
            }))
        }
      }
    })

    const request = {pageSize:0,pageToken:'qwert',view:0};

    const result = await domainsAPI.listDomains(request)

    expect(stubListDomains).to.be.calledOnce
    expect(result).to.have.property('name').to.be.equal('testname')
  })

  it('should update a domain (name)', async () => {
    const request = {
      name: 'newName'
    }

    const returnDomain = { 
      ref: 'reftest',
      name: 'nametest',
      domainUri: 'ward.copm',
      egressRule: '*',
      egressNumberRef: 'string',
      accessDeny: ['nada'],
      accessAllow: ['node'],
      createdTime: new Date(),
      updatedTime: new Date()
    }

    sandbox.stub(domainsAPI, 'getDomain').resolves(returnDomain as any)
    const stubUpdateDomain = sandbox.stub(FonosService.prototype, 'getService')
    .returns({
        updateDomain: () => {
          return {
            sendMessage: (() => Promise.resolve({getRef: () => 'testref'}))
          }
        }
      })

    const result = await domainsAPI.updateDomain(request)
    expect(result).to.have.property('ref').to.be.equal('testref')
    expect(stubUpdateDomain).to.be.calledOnce
 })

})
