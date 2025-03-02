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
import { createAclsTestCases } from "./aclsTestCases";
import { createAgentsTestCases } from "./agentsTestCases";
import { createApiKeysTestCases } from "./apiKeysTestCases";
import { createApplicationsTestCases } from "./applicationsTestCases";
import { createCallsTestCases } from "./callsTestCases";
import { createCredentialsTestCases } from "./credentialsTestCases";
import { createDomainsTestCases } from "./domainsTestCases";
import { createNumbersTestCases } from "./numbersTestCases";
import { createSecretsTestCases } from "./secretsTestCases";
import { createTrunksTestCases } from "./trunksTestCases";
import { createUsersTestCases } from "./usersTestCases";
import { createWorkspacesTestCases } from "./workspacesTestCases";

function createTestCases(expect) {
  return [
    createApplicationsTestCases(expect),
    createCallsTestCases(expect),
    createApiKeysTestCases(expect),
    createUsersTestCases(expect),
    createSecretsTestCases(expect),
    createAclsTestCases(expect),
    createAgentsTestCases(expect),
    createDomainsTestCases(expect),
    createCredentialsTestCases(expect),
    createNumbersTestCases(expect),
    createWorkspacesTestCases(expect),
    createTrunksTestCases(expect)
  ];
}

export { createTestCases };
