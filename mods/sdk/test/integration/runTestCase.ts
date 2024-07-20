/* eslint-disable import/namespace */
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
import { getChai, getSdk } from "./envUtils";
import { FonosterClient } from "../../src/client/types";

type TestCase = {
  id: string;
  name: string;
  method: string;
  request: unknown;
  grpcCode?: number;
  dependsOn?: string;
  responseValidator?: (response: unknown) => void;
};

async function runTestCase(
  client: FonosterClient,
  api: string,
  testCase: TestCase
) {
  const { AssertionError, expect } = await getChai();
  const SDK = await getSdk();

  const { method, request, grpcCode, responseValidator } = testCase;
  const apiInstance = new SDK[api](client);
  const clientMethod = apiInstance[method].bind(apiInstance);

  try {
    const response = await clientMethod(request);

    expect(response).to.not.be.undefined;

    if (responseValidator) {
      responseValidator(response);
    }

    if (grpcCode) expect.fail(`Expected error code ${grpcCode}`);

    return response;
  } catch (error) {
    if (error instanceof AssertionError) throw error;
    expect(error.code).to.be.equal(grpcCode);
  }
}

export { TestCase, runTestCase };
