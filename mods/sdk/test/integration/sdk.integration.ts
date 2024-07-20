/* eslint-disable mocha/no-setup-in-describe */
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
import Mustache from "mustache";
import { getChai, getSdk, isBrowser } from "./envUtils";
import { TestCase, runTestCase } from "./runTestCase";
import { testCases } from "./testCases";

const url = "http://localhost:7171";
const endpoint = "localhost:50051";
const accessKeyId = "WO00000000000000000000000000000000";
const username = "admin@fonoster.local";
const password = "changeme";

describe("@sdk[integration]", async function () {
  const { expect } = await getChai();
  const SDK = await getSdk();
  const resultStore = {};
  let client

  before(async function () {
    const ClientConstructor = isBrowser() ? SDK.WebClient : SDK.Client;

    client = new ClientConstructor({
      endpoint,
      url,
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
        const {
          id,
          name,
          method,
          request,
          grpcCode,
          dependsOn,
          responseValidator
        } = testCase;

        await new Promise<void>((resolve) => {
          it(name, async function () {
            if (dependsOn) {
              expect(resultStore[dependsOn]).to.be.not.undefined;
            }

            const computedRequest = Mustache.render(
              JSON.stringify(request),
              resultStore[dependsOn]
            );

            const response = await runTestCase(client, params.api, {
              id,
              name,
              method,
              request: JSON.parse(computedRequest),
              grpcCode,
              dependsOn,
              responseValidator
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
