/* eslint-disable mocha/no-setup-in-describe */
/* eslint-disable mocha/no-async-describe */import { expect } from "@esm-bundle/chai";
import Mustache from "mustache";
import { createTestCases } from "./cases/testCases";
import { TestCase, runTestCase } from "./runTestCase";
import * as SDK from "../../dist/web/index.esm.js";const url = "http://localhost:8449/";
const accessKeyId = "WO00000000000000000000000000000000";
const username = "admin@fonoster.local";
const password = "changeme";/**
 * This test is exactly the same as the one in the node.integration.ts file.
 * The only difference are the imports and the client initialization.
 */
describe("@sdk[integration]", async function () {
  const resultStore = {};
  let client: SDK.WebClient;  before(async function () {
    client = new SDK.WebClient({
      url,
      accessKeyId
    });
    await client.login(username, password);
  });  createTestCases(expect).forEach(async function (params: {
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
          responseValidator,
          skip,
          only,
          afterTestDelay
        } = testCase;        await new Promise<void>((resolve) => {
          const itFn = only ? it.only : skip ? it.skip : it;          itFn(name, async function () {
            if (dependsOn) {
              expect(resultStore[dependsOn]).to.be.not.undefined;
            }            const computedRequest = Mustache.render(
              JSON.stringify(request),
              resultStore[dependsOn]
            );            const response = await runTestCase({
              client,
              api: params.api,
              testCase: {
                id,
                name,
                method,
                request: JSON.parse(computedRequest),
                grpcCode,
                dependsOn,
                afterTestDelay,
                responseValidator
              },
              tooling: { expect, SDK }
            });            if (response) {
              resultStore[id] = response;
            }
            resolve();
          });
        });
      });
    });
  });
});
