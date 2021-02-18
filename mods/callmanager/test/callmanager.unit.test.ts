import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { FonosService } from '@fonos/core'
import CallManager from '../src/callmanager'
import { CallManagerPB } from '@fonos/core'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

describe('@fonos/callmanager', () => {
  afterEach(() => sandbox.restore())

  it('checks the requests parameters', async () => {
    const setFromStub = sandbox.stub(
      CallManagerPB.CallRequest.prototype,
      'setFrom'
    )
    const setToStub = sandbox.stub(CallManagerPB.CallRequest.prototype, 'setTo')
    const setAppStub = sandbox.stub(
      CallManagerPB.CallRequest.prototype,
      'setApp'
    )
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

    const callStub = sandbox.spy(CallManager.prototype, 'call')
    const callManager = new CallManager()
    const result = await callManager.call({
      from: '9102104343',
      to: '17853178070',
      app: 'default'
    })

    expect(setFromStub).to.be.calledOnceWith('9102104343')
    expect(setToStub).to.be.calledOnceWith('17853178070')
    expect(setAppStub).to.be.calledOnceWith('default')
    // Once in the constructor and one in the call function
    expect(serviceStub).to.be.calledTwice
    expect(callStub).to.be.calledOnce
    expect(result).to.have.property('from')
    expect(result).to.have.property('to')
    expect(result).to.have.property('app')
    expect(result).to.have.property('duration')
  })
})
