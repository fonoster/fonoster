import chai from 'chai'
import sinon, { fake } from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'
import AuthUtils, { TokenResponse, UserToken } from '../src/utils/authUtils'
import ITokenManager from '../src/utils/ITokenManager'
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
      userIdPayload: 'userId',
      issuePayload: 'issue',
      rolePayload: 'role'
    }
    const stub = sinon.stub(jwtDependency, 'encode').resolves(stubValue)

    let token = await authUtils.createTokens(
      parameter.userIdPayload,
      parameter.issuePayload,
      parameter.userIdPayload
    )
    expect(stub.calledOnce).to.be.true
    expect(token).to.be.equal(stubValue)
  })

  it('Should return a decode jwt', async () => {
    const stubValue = {
      iss: 'iss',
      role: 'role',
      userId: 'userid'
    }
    let jwtDependency = new Jwt()
    let authUtils = new AuthUtils(jwtDependency)
    let parameter = {
      accessToken: 'token'
    }
    const stub = sinon.stub(jwtDependency, 'decode').resolves(stubValue)

    let token = await authUtils.validateToken(parameter)
    expect(stub.calledOnce).to.be.true
    expect(token).to.be.equal(stubValue)
  })
})
