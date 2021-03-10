import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { FonosService } from '@fonos/core'

import UserManager from '../src/usermanager'
import { UserManagerPB } from '@fonos/core'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

describe('@fonos/usermanager', () => {
  afterEach(() => sandbox.restore())

  it.only('checks the requests parameters', async () => {
    const setFromStub = sandbox.stub(
      UserManagerPB.GetUserRequest.prototype,
      'setEmail'
    )
    
    // const setToStub = sandbox.stub(UserManagerPB.GetUserRequest.prototype, 'setEmail')
    // const setAppStub = sandbox.stub(
    //   UserManagerPB.GetUserRequest.prototype,
    //   'getEmail'
    // )

    const initStub = sandbox
      .stub(FonosService.prototype, 'init').returns()
    const serviceStub = sandbox
      .stub(FonosService.prototype, 'getService')
      .returns({
        call: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getFrom: () => '9102104343',
                getTo: () => '17853178070',
                getApp: () => 'default',
                getDuration: () => 20
              })
          }
        }
      })

    const callStub = sandbox.spy(UserManager.prototype, 'createUser')
    const userManager = new UserManager()
    const result = await userManager.createUser({
      firstName: "Richard",
      lastName: "Hernandez",
      email : "rhc0000000@gmail.com"
    })

    // expect(setFromStub).to.be.calledOnceWith('rhc921004@gmail.com')
    // expect(setToStub).to.be.calledOnceWith('rhc921004@gmail.com')
    // expect(setAppStub).to.be.calledOnceWith('default')
    expect(initStub).to.be.calledOnce
    // Once in the constructor and one in the call function
    expect(serviceStub).to.be.calledTwice
    expect(callStub).to.be.calledOnce
    expect(result).to.have.property('firstName')
    expect(result).to.have.property('lastName')
    expect(result).to.have.property('email')
  })
})
