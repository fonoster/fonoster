/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import Secrets from "../src/client/secrets";
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@Fonos/secrets/client", () => {
  afterEach(() => sandbox.restore());

  it("should create a new secret", (done) => {
    const request = {
      name: "Jenkins",
      secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    };

    const secrets = new Secrets();

    secrets
      .createSecret(request)
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it("should delete a secret", (done) => {
    const secrets = new Secrets();
    secrets
      .deleteSecret("jenkins")
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it("should list all secret", (done) => {
    const request = {
      pageSize: 1,
      pageToken: "1"
    };

    const secrets = new Secrets();
    secrets
      .listSecret(request)
      .then((result) => {
        console.log(result);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it("should get a secret by name", (done) => {
    const secrets = new Secrets();
    secrets
      .getSecret("jenkins")
      .then((result) => {
        console.log(result);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});
