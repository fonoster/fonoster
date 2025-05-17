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
import { ExpectedTextType } from "@fonoster/types";

export async function evaluateTextResponse(
  expected: { type: ExpectedTextType; response: string },
  aiResponse: string,
  testTextSimilarity: (text1: string, text2: string) => Promise<boolean>
): Promise<{ passed: boolean; errorMessage?: string }> {
  if (expected.type === ExpectedTextType.EXACT) {
    if (aiResponse !== expected.response) {
      return {
        passed: false,
        errorMessage: `Expected exact response "${expected.response}", but got "${aiResponse}".`
      };
    }
  } else if (expected.type === ExpectedTextType.SIMILAR) {
    const isSimilar = await testTextSimilarity(expected.response, aiResponse);
    if (!isSimilar) {
      return {
        passed: false,
        errorMessage: `Expected similar response to "${expected.response}", but got "${aiResponse}".`
      };
    }
  }
  return { passed: true };
}
