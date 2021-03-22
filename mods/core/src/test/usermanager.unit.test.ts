import chai from 'chai'
import sinon, { server } from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import roleHasAccess from '../server/usermanager/role_has_access'
import RoleController from '../server/usermanager/src/operations/role_operations'
import Role from '../server/usermanager/src/models/role'
import User from '../server/usermanager/src/models/user'
import UserController from '../server/usermanager/src/operations/user_operations'



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


describe('@fonos/core/usermanager/userOperations', () => {

  const sampleUser = new User({
    firstName : "test",
    lastName : "test",
    email:"test@gmail.com",
    role : "TEST",
    accessKeyId :"70lkv20G5MCgUIKYJI6Z",
    createTime : "2020-10-10",
    updateTime : "2020-10-10",
    status : "ACTIVE"
   });

  afterEach(() => sandbox.restore())

  context('teting userOperation', () => {

  it('should retrieve all users', async () => {
   const findAllStub = sinon.stub(UserController.prototype,"getAll").returns(Promise.resolve([sampleUser]));
   const user = new UserController();
   user.getAll();
   expect(findAllStub).to.has.been.calledOnce;
   expect(sampleUser).to.be.a('object');

  })

  it('should create an user', async () => {
    const createStub = sinon.stub(UserController.prototype,"saveUser");
    const user = new UserController();
    user.saveUser(sampleUser);
    expect(createStub.calledOnce).to.be.true;
    expect(createStub).to.have.been.calledWith(sampleUser);

  })

  it('should retrieve an user by email', async() => {
    const userByMailStub = sinon.stub(UserController.prototype,"getUserByEmail").resolves(sampleUser)
    const user = new UserController();
    user.getUserByEmail("test@gmail.com");
    expect(userByMailStub.calledOnce).to.be.true;
    expect(userByMailStub).to.have.been.calledWith("test@gmail.com");
  })

  it('should update an user status',async() =>{
    const updateStub = sinon.stub(UserController.prototype,"updateUserStatus");
    const user = new UserController();
    user.updateUserStatus("test@gmail.com","ACTIVE")
    expect(updateStub.calledOnce).to.be.true;
  })

})
})