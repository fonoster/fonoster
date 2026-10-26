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
import { NumbersLister, someRoutrNumber } from "../utils/someRoutrNumber";

/** Whether `e164` (CreateCall's `from`) is a Number of the workspace `accessKeyId`. */
type IsWorkspaceNumber = (
  accessKeyId: string,
  e164: string
) => Promise<boolean>;

/**
 * CreateCall's `from` becomes X-Dod-Number, which Routr uses to pick the Number's trunk, so it
 * must be one of the caller's own Numbers (security review C2). It asks Routr every time (no
 * cache: a Number just removed is refused), matching `tel:<from>` and the workspace.
 */
function createIsWorkspaceNumber(numbers: NumbersLister): IsWorkspaceNumber {
  return async (accessKeyId, e164) => {
    if (!accessKeyId || !e164) return false;
    const telUrl = `tel:${e164}`;
    return someRoutrNumber(
      numbers,
      (n) => n.telUrl === telUrl && n.extended?.accessKeyId === accessKeyId
    );
  };
}

export { createIsWorkspaceNumber, IsWorkspaceNumber, NumbersLister };
