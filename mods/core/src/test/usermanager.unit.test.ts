import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import roleHasAccess from '../server/usermanager/role_has_access'
import RoleController from '../server/usermanager/src/operations/role_operations'
import Role from '../server/usermanager/src/models/role'
import User from '../server/usermanager/src/models/user'
import {userOperation} from '../server/usermanager/src/operations/user_operations'
import Mongoose from 'mongoose'


const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

describe('@fonos/core/usermanager/roleOperations', () => {
  afterEach(() => sandbox.restore())

  it('checks if a role has access to a service', async () => {
    const role1 = new Role({role: 'GUEST', description: '', access: ['a']})
    const role2 = new Role({role: 'USER', description: '', access: ['a', 'b']})
    const role3 = new Role({role: 'ADMIN', description: '', access: ['a', 'b', 'c']})
    const roleStub = sandbox.stub(RoleController.prototype, 'getRoles').returns(Promise.resolve([role1, role2, role3]))
    const hasAccess = await roleHasAccess('USER', 'a')
    expect(hasAccess).to.be.equal(true)
    expect(roleStub).to.have.been.calledOnce
  })

  it('fails with role not having access', async () => {
    const role = new Role({role: 'GUEST', description: '', access: ['a']})
    const roleStub = sandbox.stub(RoleController.prototype, 'getRoles').returns(Promise.resolve([]))
    const hasAccess = await roleHasAccess('GUEST', 'b')
    expect(roleStub).to.has.been.calledOnce
    expect(hasAccess).to.be.equal(false)
  })


})


describe('@fonos/core/usermanager/userOperations', ()=>{
  let findStub;
  let sampleUser : any[];

  beforeEach(()=>{
    sampleUser = [{
      firstName: 'GUEST',
      lastName: 'GUEST',
      email: 'GUEST@GMAIL.COM',
      accessKeyId: '6033ed5bf911e40700000002',
      role: 'USER',
      createTime: "Tue Feb 23 2021 09:45:08 GMT-0400 (Atlantic Standard Time)",
      updateTime: "Tue Feb 23 2021 09:45:08 GMT-0400 (Atlantic Standard Time)",
      status: 'ACTIVE'
    }]
    findStub = sandbox.stub(Mongoose.Model, 'find' ).resolves(sampleUser);
  })

  afterEach(()=>{
    sandbox.restore();
  })

  context('getUsers',()=>{
    it('should return all users', (done)=>{
      let result = userOperation.getUsers();
      expect(result).to.exist;
      done();
    })

  })

})
