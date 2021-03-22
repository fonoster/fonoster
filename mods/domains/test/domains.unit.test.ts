import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import Domains from '../src/domains'
import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'
import { DomainsPB, FonosService } from '@fonos/core'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: join(__dirname, '..', '..', '.env') })
}


describe('@Fonos/domains', () => {
  let domains: any

  before(() => {
    domains = new Domains({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
  })

  afterEach(() => {
    sandbox.restore();
  })

  const initStub = sandbox
  .stub(FonosService.prototype, 'init').returns()
  const serviceStub = sandbox
  .stub(FonosService.prototype, 'getService')
  .returns({
    createDomain: () => {
      return {
        sendMessage: () =>
          Promise.resolve({
            ref: 'testref',
            name: 'testname',
            domainUri: 'testdomain',
            egressRule: '*',
            egressNumberRef: '12345'
          })
      }
    }
  })

  const domainsAPI = new Domains()

  it('Create domain', async () => {

    const req = {
      name: 'testname',
      domainUri: 'testdomain',
      egressRule: '*',
      egressNumberRef: '12345'
    }

    let result = await domainsAPI.createDomain(req)

    expect(initStub).to.be.calledTwice
    expect(result).to.have.property('ref').to.be.equal('testref')
    expect(result).to.have.property('name').to.be.string
    expect(result).to.have.property('domainUri').to.be.string
    expect(result).to.have.property('egressRule').to.be.string
    expect(result).to.have.property('egressNumberRef').to.be.string
    expect(result).to.exist
    
  })

  it('Get a Domain', async () => {
    const serviceStub = sandbox
    .stub(FonosService.prototype, 'getService')
    .returns({
      getDomain: () => {
        return {
          sendMessage: () =>
            Promise.resolve({
              ref: 'testref',
              name: 'testname',
              domainUri: 'testdomain',
              egressRule: '*',
              egressNumberRef: '12345'
            })
        }
      }
    })

    let request = 'testref';
    let res = await domainsAPI.getDomain(request)
    
    expect(initStub).to.be.calledTwice
    expect(res).to.have.property('ref').to.be.equal('testref')
    expect(res).to.have.property('name').to.be.string
    expect(res).to.have.property('domainUri').to.be.string
    expect(res).to.have.property('egressRule').to.be.string
    expect(res).to.have.property('egressNumberRef').to.be.string

  })

  it('Deletes a Domain', async () => {
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

    let request = 'testref';
    let res = await domainsAPI.deleteDomain(request)
    
    expect(initStub).to.be.calledTwice
    expect(serviceStub).to.have.been.calledOnce
    expect(res).to.be.a('object').empty
  })

  it('List domains', async () => {
    const stubListDomains = sandbox
    .stub(FonosService.prototype, 'getService')
    .returns({
      listDomains: () => {
        return {
          sendMessage: ((r: any) => Promise.resolve([]))
        }
      }
    })

    const request = {pageSize:0,pageToken:'qwert',view:0};

    let result = await domainsAPI.listDomains(request)

    expect(stubListDomains).to.be.calledOnce
    expect(result).to.exist
  })


  it('Should udpdate a domain (name)', async () =>{
    let request ={
        name:"newName"
    };
    const returnDomain = new DomainsPB.Domain();
    const stubDB = sandbox.stub(domains,'getDomain').returns(returnDomain)
    const stubUpdateDomain = sandbox.stub(FonosService.prototype,'getService')
    .returns({
        updateDomain:() =>{
          return{
            sendMessage: ((r: any) => Promise.resolve(returnDomain))
          }
        }
      })

    let result = await domains.updateDomain(request)
    expect(result).to.be.equal(returnDomain)
    expect(stubUpdateDomain).to.be.calledOnce
 })

})
