import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import UserManager from '../src/usermanager'


const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

// {
//   firstname: "test",
//   lastname: "test",
//   username: "rihernandez",
//   email : "testgmail.com",
//   access_key_id : "fonos.io"
// }

describe('@fonos/usermanager', () => {
  afterEach(() => sandbox.restore())

  it.only('needs testing', async () => {
    const userManager = new UserManager();
    const res = await userManager.createUser(
      {
        firstname: "test",
        lastname: "test",
        username: "rihernandez",
        email : "testgmail.com",
        access_key_id : "fonos.io"
      }
    )
    console.log(res);
    
    
  })
})
