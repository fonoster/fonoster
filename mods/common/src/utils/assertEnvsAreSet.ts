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
import { getLogger } from "@fonoster/logger";

/**
 * Function that asserts that the given environment variable is set.
 *
 * @param {string[]} variables environment variables to check
 */
function assertEnvsAreSet(variables: string[]) {
  variables.forEach((variable: string) => {
    if (!(variable in process.env)) {
      const logger = getLogger({ service: "common", filePath: __filename });
      logger.error(
        `the environment variable ${variable} is required but was not found`
      );
      process.exit(1);
    }
  });
}

export { assertEnvsAreSet };
