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
import * as SDK from "@fonoster/sdk";
import { SinonSandbox } from "sinon";
import { AuthenticatedCommand } from "../src/AuthenticatedCommand";

/** Commands get a fake logged-in client; the SDK classes are stubbed per test. */
export function stubClient(sandbox: SinonSandbox) {
  const client = {} as unknown as SDK.Client;
  sandbox
    .stub(
      AuthenticatedCommand.prototype as unknown as {
        createSdkClient: () => Promise<SDK.Client>;
      },
      "createSdkClient"
    )
    .resolves(client);
  return client;
}
