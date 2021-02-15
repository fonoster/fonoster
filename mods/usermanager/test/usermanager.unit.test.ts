import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import UserManager from '../src/usermanager'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

describe('@fonos/usermanager', () => {
  afterEach(() => sandbox.restore())

  it.only('needs testing', async () => {
    const userManager = new UserManager();
    const res = await userManager.createUser(
      {
        firstName: "test",
        lastName: "test",
        username: "rihernandez",
        email : "test@gmail.com",
        accessKeyId : "fonos"
      }
    )    
  })
})
