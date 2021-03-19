import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

describe('@fonos/usermanager', () => {
  afterEach(() => sandbox.restore())

  it('needs testing', async () => {
  })
})
