import chai from 'chai'
import sinon, { fake } from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'
import AuthUtils, { TokenResponse, UserToken } from '../src/utils/auth_utils'
import ITokenManager from '../src/utils/itoken_manager'
import Jwt from '../src/utils/jwt'
const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: join(__dirname, '..', '..', '..', '.env') })
}

describe('@fonos/authentication', () => {
  let tokenManager

  before(async () => {
    // This will create the bucket if it does not exist
    tokenManager = sinon.spy()
    sandbox.stub(Jwt)
  })

  it('Should create a valid token', async () => {
    const stubValue = 'tokenfake'
    let jwtDependency = new Jwt()
    let authUtils = new AuthUtils(jwtDependency)
    let parameter = {
      accessKeyIdPayload: 'userId',
      issuePayload: 'issue',
      rolePayload: 'role',
      privateKey: 'privatekey'
    }
    const stub = sinon.stub(jwtDependency, 'encode').resolves(stubValue)

    let token = await authUtils.createTokens(
      parameter.accessKeyIdPayload,
      parameter.issuePayload,
      parameter.rolePayload,
      'privatekey'
    )
    expect(stub.calledOnce).to.be.true
    expect(token).to.be.equal(stubValue)
  })

  it('Should return a decode jwt', async () => {
    const stubValue = {
      iss: 'iss',
      role: 'role',
      accessKeyId: 'userid'
    }
    let jwtDependency = new Jwt()
    let authUtils = new AuthUtils(jwtDependency)
    let parameter = {
      accessToken: 'token'
    }
    const stub = sinon.stub(jwtDependency, 'decode').resolves(stubValue)

    let token = await authUtils.validateToken(parameter, 'privatekey')
    expect(stub.calledOnce).to.be.true
    expect(token).to.be.equal(stubValue)
  })
})
