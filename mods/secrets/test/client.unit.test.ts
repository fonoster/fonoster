/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import chaiAsPromised from "chai-as-promised";
import { APIClient } from "@fonoster/common";
import Secrets from "../src/client/secrets";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

const secretsObj = {
  getName: () => "my-secret",
  getSecret: () => "abc"
};

describe("@fonoster/secrets/client", () => {
  afterEach(() => sandbox.restore());

  it("should create a secret", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      createSecret: () => {
        return {
          sendMessage: () => Promise.resolve(secretsObj)
        };
      }
    });
    const secrets = new Secrets();
    const result = await secrets.createSecret({
      name: secretsObj.getName(),
      secret: "test"
    });
    expect(result).to.have.property("name").to.be.equal(secretsObj.getName());
  });

  it("should list all secrets", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        listSecretsId: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getNextPageToken: () => "1",
                getSecretsList: () => [secretsObj.getName()]
              })
          };
        }
      });

    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };

    const secretsAPI = new Secrets();
    const result = await secretsAPI.listSecrets(request);

    expect(serviceStub).to.be.calledTwice;
    expect(result.secrets[0])
      .to.have.property("name")
      .to.be.equal(secretsObj.getName());
  });

  it("should get a secret", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const stubFunc = sandbox.stub(APIClient.prototype, "getService").returns({
      getSecret: () => {
        return {
          sendMessage: () => Promise.resolve(secretsObj)
        };
      }
    });
    const secret = new Secrets();
    const result = await secret.getSecret(secretsObj.getName());
    expect(result).to.have.property("name").to.be.equal(secretsObj.getName());
    expect(result)
      .to.have.property("secret")
      .to.be.equal(secretsObj.getSecret());
  });

  it("should delete a function", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const stubFunc = sandbox.stub(APIClient.prototype, "getService").returns({
      deleteSecret: () => {
        return {
          sendMessage: () => Promise.resolve({})
        };
      }
    });
    const secret = new Secrets();
    const result = await secret.deleteSecret(secretsObj.getName());
    expect(stubFunc).to.be.calledTwice;
    expect(result).to.be.undefined;
  });
});
