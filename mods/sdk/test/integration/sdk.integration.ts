/* eslint-disable mocha/no-setup-in-describe */
/* eslint-disable no-loops/no-loops */
/* eslint-disable mocha/no-async-describe */
/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import dotenv from "dotenv";
import Mustache from "mustache";
import sinonChai from "sinon-chai";
import { TestCase, runTestCase } from "./runTestCase";
import { testCases } from "./testCases";
import * as SDK from "../../src/node";

// Load environment variables
dotenv.config();

chai.use(chaiAsPromised);
chai.use(sinonChai);

const endpoint = "localhost:50051";
const accessKeyId = "WO00000000000000000000000000000000";
const username = process.env.OWNER_EMAIL;
const password = process.env.OWNER_PASSWORD;

describe("@sdk[integration]", async function () {
  const resultStore = {};
  let client: SDK.Client;

  before(async function () {
    client = new SDK.Client({
      endpoint,
      accessKeyId,
      allowInsecure: true
    });
    await client.login(username, password);
  });

  testCases.forEach(async function (params: {
    api: string;
    cases: TestCase[];
  }) {
    describe(params.api, async function () {
      params.cases.forEach(async function (testCase: TestCase) {
        const { id, name, method, request, grpcCode, needsResultFrom } =
          testCase;

        await new Promise<void>((resolve) => {
          it(name, async function () {
            if (needsResultFrom) {
              expect(resultStore[needsResultFrom]).to.be.not.undefined;
            }

            const computedRequest = Mustache.render(
              JSON.stringify(request),
              resultStore[needsResultFrom]
            );

            const response = await runTestCase(client, params.api, {
              id,
              name,
              method,
              request: JSON.parse(computedRequest),
              grpcCode,
              needsResultFrom
            });

            if (response) {
              resultStore[id] = response;
            }
            resolve();
          });
        });
      });
    });
  });
});
