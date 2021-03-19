import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { FonosService } from '@fonos/core'

import UserManager from '../src/usermanager'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

describe('@fonos/usermanager', () => {
  afterEach(() => sandbox.restore())

  it('checks the requests parameters', async () => {

    const initStub = sandbox.stub(FonosService.prototype, 'init').returns()
    const serviceStub = sandbox
      .stub(FonosService.prototype, 'getService')
      .returns({
        createUser: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getFirstName: () => 'Test',
                getLastName: () => 'Test',
                getEmail: () => 'testing@gmail.com',
                getAccessKeyId: () => '70lkv20G5MCgUIKYJI6Z',
                getRole: () => 'USER',
                getCreateTime: () => '2020-10-10',
                getUpdateTime: () => '2020-10-10',
                getStatus:() => 'ACTIVE'
              })
          }
        }
      })

    const callStub = sandbox.spy(UserManager.prototype, 'createUser')
    const userManager = new UserManager()
    const result = await userManager.createUser({
      firstName: "Test",
      lastName: "Test",
      email : "testing@gmail.com"
    })


    expect(initStub).to.be.calledOnce
    // Once in the constructor and one in the call function
    expect(serviceStub).to.be.calledTwice
    expect(callStub).to.be.calledOnce
    expect(result).to.have.property('firstName')
    expect(result).to.have.property('lastName')
    expect(result).to.have.property('email')
  })
})
