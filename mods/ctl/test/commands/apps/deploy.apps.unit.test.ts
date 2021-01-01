import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import AppManager from '@fonos/appmanager'
import DeployCommand from '../../../dist/commands/apps/deploy'
import { cli } from 'cli-ux'
const sandbox = sinon.createSandbox()
const expect = chai.expect
chai.use(sinonChai)

describe('@fonos/ctl/apps', () => {
  let deployAppStub: any
  let consoleStub: any
  let actionStub: any

  afterEach(() => sandbox.restore())

  beforeEach(() => {
    actionStub = sandbox.stub(cli.action, 'start')
    deployAppStub = sinon.stub(AppManager.prototype, 'deployApp').returns(
      Promise.resolve({
        getName: () => 'My App',
        getDescription: () => 'A test application',
        getCreateTime: () => 'January 01, 1970 00:00:00 UTC.',
        getBucket: () => 'default'
      })
    )
    consoleStub = sandbox.stub(console, 'log')
  })

  it('should deploy app', async () => {
    await DeployCommand.run()
    expect(deployAppStub).to.be.calledOnce
    expect(actionStub).to.be.calledOnce
    expect(consoleStub.getCall(0).args[0]).to.contain('Default Bucket: default')
  })
})
