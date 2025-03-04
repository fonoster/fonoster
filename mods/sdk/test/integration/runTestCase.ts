/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import { FonosterClient } from "../../src/client/types";

type TestCase = {
  id: string;
  name: string;
  method: string;
  request: unknown;
  grpcCode?: number;
  dependsOn?: string;
  responseValidator?: (response: unknown) => void;
  skip?: boolean;
  only?: boolean;
  afterTestDelay?: number;
};

async function runTestCase(params: {
  client: FonosterClient;
  api: string;
  testCase: TestCase;
  tooling: { expect; SDK };
}) {
  const { expect, SDK } = params.tooling;
  const { client, api, testCase } = params;

  const { method, request, grpcCode, responseValidator, afterTestDelay } =
    testCase;
  const apiInstance = new SDK[api](client);
  const clientMethod = apiInstance[method].bind(apiInstance);

  try {
    const response = await clientMethod(request);

    expect(response).to.not.be.undefined;

    if (responseValidator) {
      responseValidator(response);
    }

    if (grpcCode) expect.fail(`Expected error code ${grpcCode}`);

    if (afterTestDelay) {
      await new Promise((resolve) => setTimeout(resolve, afterTestDelay));
    }

    return response;
  } catch (error) {
    if (grpcCode) {
      expect(error.code).to.equal(grpcCode);
      return;
    }
    throw error;
  }
}

export { TestCase, runTestCase };
