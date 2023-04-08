/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import Users, { UsersPB } from "../src/client/users";
import chaiAsPromised from "chai-as-promised";
import { APIClient } from "@fonoster/common";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/users", () => {
  const userObj = new UsersPB.User();
  userObj.setRef("Nx05y-ldZa");
  userObj.setName("John Doe");
  userObj.setEmail("john@email.com");
  userObj.setAvatar("https://avatar.io/avt.png");

  afterEach(() => sandbox.restore());

  it("should list users", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        listUsers: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getUsersList: () => [userObj]
              })
          };
        }
      });

    const usersAPI = new Users();
    const result = await usersAPI.listUsers({});

    expect(serviceStub).to.be.calledTwice;
    expect(result.users[0])
      .to.have.property("ref")
      .to.be.equal(userObj.getRef());
    expect(result.users[0])
      .to.have.property("name")
      .to.be.equal(userObj.getName());
    expect(result.users[0])
      .to.have.property("email")
      .to.be.equal(userObj.getEmail());
    expect(result.users[0])
      .to.have.property("accessKeyId")
      .to.be.equal(userObj.getAccessKeyId());
    expect(result.users[0])
      .to.have.property("avatar")
      .to.be.equal(userObj.getAvatar());
    expect(result.users[0])
      .to.have.property("createTime")
      .to.be.equal(userObj.getCreateTime());
    expect(result.users[0])
      .to.have.property("updateTime")
      .to.be.equal(userObj.getUpdateTime());
  });

  it("should create a user", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        createUser: () => {
          return {
            sendMessage: () => Promise.resolve(userObj)
          };
        }
      });

    const req = {
      name: userObj.getName(),
      email: userObj.getEmail(),
      secret: "1234",
      avatar: userObj.getAvatar()
    };

    const usersAPI = new Users();
    const result = await usersAPI.createUser(req);

    expect(result).to.have.property("ref").to.be.equal(userObj.getRef());
    expect(result)
      .to.have.property("accessKeyId")
      .to.be.equal(userObj.getAccessKeyId());
    expect(result).to.have.property("email").to.be.equal(userObj.getEmail());
    expect(result).to.have.property("name").to.be.equal(userObj.getName());
    expect(result).to.have.property("avatar").to.be.equal(userObj.getAvatar());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should get a user", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        getUser: () => {
          return {
            sendMessage: () => Promise.resolve(userObj)
          };
        }
      });

    const ref = "Nx05y-ldZa";
    const usersAPI = new Users();
    const result = await usersAPI.getUser(ref);

    expect(result).to.have.property("ref").to.be.equal(userObj.getRef());
    expect(result)
      .to.have.property("accessKeyId")
      .to.be.equal(userObj.getAccessKeyId());
    expect(result).to.have.property("email").to.be.equal(userObj.getEmail());
    expect(result).to.have.property("name").to.be.equal(userObj.getName());
    expect(result).to.have.property("avatar").to.be.equal(userObj.getAvatar());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should delete a user", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        deleteUser: () => {
          return {
            sendMessage: () => Promise.resolve({ ref: "Nx05y-ldZa" })
          };
        }
      });

    const usersAPI = new Users();
    const res = await usersAPI.deleteUser(userObj.getRef());

    expect(serviceStub).to.have.been.calledTwice;
    expect(res).to.have.property("ref").to.be.equal(userObj.getRef());
  });

  it("should update a user", async () => {
    const request = {
      ref: userObj.getRef(),
      secret: "1234",
      avatar: userObj.getAvatar(),
      status: "active",
      limiter: "starter"
    };

    sandbox.stub(APIClient.prototype, "init").returns();
    const updateUserStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        updateUser: () => {
          return {
            sendMessage: () =>
              Promise.resolve({ getRef: () => userObj.getRef() })
          };
        }
      });

    const usersAPI = new Users();
    const result = await usersAPI.updateUser(request);
    expect(result).to.have.property("ref").to.be.equal(userObj.getRef());
    expect(updateUserStub).to.be.calledTwice;
  });

  it("should login a user", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const loginUserStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        createUserCredentials: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getAccessKeyId: () => userObj.getAccessKeyId(),
                getAccessKeySecret: () => "..."
              })
          };
        }
      });

    const request = {
      email: userObj.getEmail(),
      secret: "1234"
    };

    const usersAPI = new Users();
    const result = await usersAPI.createUserCredentials(request);
    expect(result)
      .to.have.property("accessKeyId")
      .to.be.equal(userObj.getAccessKeyId());
    expect(result).to.have.property("accessKeySecret").to.be.equal("...");
    expect(loginUserStub).to.be.calledTwice;
  });
});
