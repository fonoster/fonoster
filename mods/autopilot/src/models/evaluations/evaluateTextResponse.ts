/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * Licensed under the MIT License.
 */

import { ExpectedTextType } from "./types";

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
